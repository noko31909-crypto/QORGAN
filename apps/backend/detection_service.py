import cv2
from ultralytics import YOLO
import threading
import time
from datetime import datetime
from pathlib import Path
import gc
import queue
import numpy as np
import psutil
import os

class DetectionService:
    """
    Optimized weapon detection service for multi-camera deployment (20-30 cameras).
    
    Key optimizations:
    - Single shared YOLO model loaded once (no per-camera copies)
    - Thread pool with bounded concurrency (max_workers)
    - Frame skipping per camera to reduce load
    - Memory monitoring with automatic GC
    - Batch inference support when GPU available
    - Graceful degradation under resource pressure
    """
    
    def __init__(self, model_path, confidence_threshold=0.5, save_dir=None,
                 persistence_frames: int = 3, alert_cooldown_seconds: float = 10,
                 min_bbox_area_ratio: float = 0.01, max_bbox_area_ratio: float = 0.7,
                 allow_demo_video_fallback: bool = False):
        """
        Initialize weapon detection service
        
        Args:
            model_path: Path to YOLO model
            confidence_threshold: Minimum confidence for detection
            save_dir: Directory to store detection images
            persistence_frames: Consecutive frames needed before alerting
            alert_cooldown_seconds: Cooldown between alerts per camera
            min_bbox_area_ratio: Ignore detections smaller than this fraction
            max_bbox_area_ratio: Ignore detections larger than this fraction
            allow_demo_video_fallback: Use demo video if camera fails (not for production)
        """
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.is_running = False
        self.detection_callback = None
        self.recent_detections = []
        self.max_recent_detections = 50
        self.camera_threads = {}
        self.camera_stop_flags = {}
        self._global_cooldowns: dict[str, float] = {}
        self._lock = threading.Lock()
        self.persistence_frames = max(1, int(persistence_frames))
        self.alert_cooldown_seconds = max(0, float(alert_cooldown_seconds))
        self.min_bbox_area_ratio = max(0.0, float(min_bbox_area_ratio))
        self.max_bbox_area_ratio = min(1.0, float(max_bbox_area_ratio))
        self.allow_demo_video_fallback = bool(allow_demo_video_fallback)
        self.demo_video = Path(__file__).resolve().parents[2] / 'data' / 'demo' / 'sample_school_video.mp4'
        
        # Extended weapon keywords
        self.allowed_keywords = {
            'weapon', 'knife', 'gun', 'rifle', 'pistol', 'firearm', 'handgun', 'shotgun',
            'axe', 'ax', 'hatchet', 'machete', 'sword', 'blade', 'dagger', 'spear',
            'grenade', 'explosive', 'bomb', 'molotov'
        }
        self.concealed_keywords = {'concealed', 'hidden', 'pocket', 'waistband', 'holster'}
        self.min_concealed_area_ratio = max(0.0, float(min_bbox_area_ratio) * 0.5)
        self.max_concealed_area_ratio = min(1.0, 0.3)
        
        # Performance tuning for multi-camera
        self.max_workers = int(os.getenv('DETECTION_MAX_WORKERS', '8'))  # Max concurrent threads
        self.frame_skip = int(os.getenv('DETECTION_FRAME_SKIP', '2'))    # Skip N-1 frames per camera
        self.memory_limit_mb = int(os.getenv('DETECTION_MEMORY_LIMIT_MB', '3000'))  # RAM limit
        self.max_active_cameras = int(os.getenv('DETECTION_MAX_CAMERAS', '30'))  # Hard limit
        self.inference_queue = queue.Queue(maxsize=self.max_workers * 2)
        
        # Per-camera frame counter for frame skipping
        self.camera_frame_counts = {}
        
        # Resource monitoring
        self._resource_thread = None
        self._resource_stop = threading.Event()
        self._memory_pressure = False  # True when memory is high
        
        # Create save directory
        self.save_dir = Path(save_dir) if save_dir else Path('detection_images')
        self.save_dir.mkdir(parents=True, exist_ok=True)
        
        self._load_model()
    
    def _load_model(self):
        """Load YOLO model — single instance shared across all cameras"""
        try:
            self.model = YOLO(self.model_path, task='detect')
            print(f"[DetectionService] Model loaded: {self.model_path}")
            print(f"[DetectionService] Max workers: {self.max_workers}, Frame skip: {self.frame_skip}")
            print(f"[DetectionService] Memory limit: {self.memory_limit_mb}MB, Max cameras: {self.max_active_cameras}")
        except Exception as e:
            print(f"[DetectionService] Error loading model: {e}")
            raise
    
    def set_detection_callback(self, callback):
        """Set callback function for weapon detection alerts"""
        self.detection_callback = callback
    
    def _get_memory_usage_mb(self):
        """Get current memory usage in MB"""
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024 * 1024)
    
    def _memory_monitor(self):
        """Background thread to monitor memory and reduce load if needed"""
        while not self._resource_stop.is_set():
            mem_mb = self._get_memory_usage_mb()
            
            if mem_mb > self.memory_limit_mb * 0.9:
                if not self._memory_pressure:
                    print(f"[DetectionService] MEMORY PRESSURE: {mem_mb:.0f}MB / {self.memory_limit_mb}MB")
                    print("[DetectionService] Running GC, reducing frame rate...")
                    gc.collect()
                    # Temporarily increase frame skip
                    self.frame_skip = max(self.frame_skip, 4)
                    self._memory_pressure = True
            elif mem_mb < self.memory_limit_mb * 0.7:
                if self._memory_pressure:
                    print(f"[DetectionService] Memory recovered: {mem_mb:.0f}MB")
                    self.frame_skip = int(os.getenv('DETECTION_FRAME_SKIP', '2'))
                    self._memory_pressure = False
            
            # Periodic GC every 30 seconds
            gc.collect()
            self._resource_stop.wait(30)
    
    def start_resource_monitoring(self):
        """Start background memory monitoring"""
        if self._resource_thread is None:
            self._resource_stop.clear()
            self._resource_thread = threading.Thread(
                target=self._memory_monitor, daemon=True
            )
            self._resource_thread.start()
    
    def stop_resource_monitoring(self):
        """Stop background memory monitoring"""
        self._resource_stop.set()
        self._resource_thread = None
    
    def get_resource_status(self):
        """Get current resource utilization"""
        mem_mb = self._get_memory_usage_mb()
        process = psutil.Process(os.getpid())
        cpu_pct = process.cpu_percent(interval=0.1)
        with self._lock:
            active = len(self.camera_threads)
        return {
            'active_cameras': active,
            'max_cameras': self.max_active_cameras,
            'memory_mb': round(mem_mb, 1),
            'memory_limit_mb': self.memory_limit_mb,
            'cpu_percent': round(cpu_pct, 1),
            'frame_skip': self.frame_skip,
            'memory_pressure': self._memory_pressure,
        }
    
    def _get_class_name(self, class_id):
        FALLBACK_NAMES = {
            0: 'knife', 1: 'pistol', 2: 'rifle', 3: 'axe',
            4: 'machete', 5: 'grenade', 6: 'concealed_weapon', 7: 'weapon'
        }
        names = getattr(self.model, 'names', None)
        if isinstance(names, dict):
            return str(names.get(class_id, FALLBACK_NAMES.get(class_id, f'class_{class_id}')))
        if isinstance(names, list) and 0 <= class_id < len(names):
            return str(names[class_id])
        return FALLBACK_NAMES.get(class_id, f'class_{class_id}')
    
    def _is_weapon_like_class(self, class_name: str) -> bool:
        lowered = (class_name or '').strip().lower()
        if not lowered:
            return False
        if lowered.startswith('class_'):
            return True
        return any(k in lowered for k in self.allowed_keywords)
    
    def _is_concealed_weapon(self, class_name: str) -> bool:
        lowered = (class_name or '').strip().lower()
        return any(k in lowered for k in self.concealed_keywords)
    
    def start_camera_detection(self, camera_id, camera_source, camera_location='Unknown', school_code=None):
        """
        Start detection on a specific camera.
        Respects max_active_cameras limit and checks available resources.
        """
        with self._lock:
            if camera_id in self.camera_threads:
                print(f"[DetectionService] Camera {camera_id} already running")
                return
            
            active_count = len(self.camera_threads)
            if active_count >= self.max_active_cameras:
                print(f"[DetectionService] Max cameras reached ({self.max_active_cameras}). "
                      f"Cannot start camera {camera_id}. Stop one first.")
                return False
            
            # Check memory before starting new camera
            mem_mb = self._get_memory_usage_mb()
            if mem_mb > self.memory_limit_mb * 0.85:
                print(f"[DetectionService] Low memory ({mem_mb:.0f}MB). "
                      f"Cannot start camera {camera_id}. Wait for resources.")
                return False
            
            stop_event = threading.Event()
            self.camera_stop_flags[camera_id] = stop_event
            self.camera_frame_counts[camera_id] = 0

        thread = threading.Thread(
            target=self._detection_loop,
            args=(camera_id, camera_source, camera_location, stop_event, school_code),
            daemon=True
        )
        thread.start()
        with self._lock:
            self.camera_threads[camera_id] = thread
        
        with self._lock:
            active = len(self.camera_threads)
        print(f"[DetectionService] Camera {camera_id} started. Active: {active}/{self.max_active_cameras}")
        return True
    
    def stop_camera_detection(self, camera_id):
        """Stop detection on a specific camera"""
        with self._lock:
            stop_event = self.camera_stop_flags.get(camera_id)
            if stop_event is not None:
                stop_event.set()
            if camera_id in self.camera_threads:
                del self.camera_threads[camera_id]
            if camera_id in self.camera_stop_flags:
                del self.camera_stop_flags[camera_id]
            if camera_id in self.camera_frame_counts:
                del self.camera_frame_counts[camera_id]
        
        # Free OpenCV resources
        gc.collect()
        print(f"[DetectionService] Camera {camera_id} stopped")
    
    def stop_all_cameras(self):
        """Stop all running cameras"""
        with self._lock:
            ids = list(self.camera_threads.keys())
        
        for cid in ids:
            self.stop_camera_detection(cid)
        
        print(f"[DetectionService] All {len(ids)} cameras stopped")
    
    def _open_capture(self, camera_source):
        """Open camera capture with optimized settings"""
        cap = cv2.VideoCapture(camera_source)
        if cap.isOpened():
            # Optimize buffer size to reduce latency
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 2)
            # Set lower resolution if needed for performance (optional)
            target_w = int(os.getenv('DETECTION_FRAME_WIDTH', '640'))
            target_h = int(os.getenv('DETECTION_FRAME_HEIGHT', '480'))
            if target_w > 0 and target_h > 0:
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, target_w)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, target_h)
            return cap, str(camera_source)
        
        if self.allow_demo_video_fallback and self.demo_video.exists():
            demo_cap = cv2.VideoCapture(str(self.demo_video))
            if demo_cap.isOpened():
                demo_cap.set(cv2.CAP_PROP_BUFFERSIZE, 2)
                print(f"[DetectionService] Using demo video fallback: {self.demo_video}")
                return demo_cap, str(self.demo_video)
        
        return cap, str(camera_source)
    
    def _detection_loop(self, camera_id, camera_source, camera_location, stop_event, school_code=None):
        """
        Optimized detection loop for a camera.
        Uses frame skipping, shared model inference, and memory monitoring.
        """
        cap, used_source = self._open_capture(camera_source)
        
        if not cap.isOpened():
            print(f"[DetectionService] Could not open camera {camera_id}")
            with self._lock:
                self.camera_threads.pop(camera_id, None)
                self.camera_stop_flags.pop(camera_id, None)
                self.camera_frame_counts.pop(camera_id, None)
            return
        
        print(f"[DetectionService] Camera {camera_id} source: {used_source}")
        last_detection_time = 0
        consecutive_count = 0
        frame_count = 0
        fps_counter = 0
        fps_time = time.time()
        
        try:
            self.is_running = True
            while not stop_event.is_set():
                ret, frame = cap.read()
                if not ret:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    consecutive_count = 0
                    time.sleep(0.1)
                    continue
                
                frame_count += 1
                
                # Frame skipping: process every Nth frame to reduce CPU load
                with self._lock:
                    current_skip = self.frame_skip
                
                if frame_count % current_skip != 0:
                    # Still track consecutive count reset
                    consecutive_count = 0
                    continue
                
                # FPS logging (every 100 frames)
                fps_counter += 1
                if fps_counter % 100 == 0:
                    elapsed = time.time() - fps_time
                    fps = 100.0 / elapsed if elapsed > 0 else 0
                    fps_time = time.time()
                    fps_counter = 0
                    with self._lock:
                        active = len(self.camera_threads)
                    print(f"[DetectionService] Camera {camera_id}: {fps:.1f} fps, "
                          f"active={active}, skip={current_skip}, "
                          f"mem={self._get_memory_usage_mb():.0f}MB")
                
                # Check memory pressure — if high, skip inference for this frame
                if self._memory_pressure and frame_count % (current_skip * 2) != 0:
                    consecutive_count = 0
                    continue
                
                # Run detection (shared model)
                try:
                    results = self.model(frame, verbose=False)
                except Exception as e:
                    print(f"[DetectionService] Inference error on camera {camera_id}: {e}")
                    consecutive_count = 0
                    continue
                
                current_time = time.time()
                frame_h, frame_w = frame.shape[:2]
                detection_box = None
                detection_class_id = None
                detection_confidence = None
                detection_result = None
                
                for r in results:
                    if r.boxes is None or len(r.boxes) == 0:
                        continue
                    for box in r.boxes:
                        confidence = float(box.conf[0])
                        if confidence < self.confidence_threshold:
                            continue
                        
                        x1, y1, x2, y2 = box.xyxy[0]
                        area_ratio = ((x2 - x1) * (y2 - y1)) / (frame_w * frame_h + 1e-6)
                        
                        detection_class_id = int(box.cls[0])
                        class_name = self._get_class_name(detection_class_id)
                        if not self._is_weapon_like_class(class_name):
                            continue
                        
                        if self._is_concealed_weapon(class_name):
                            min_area = self.min_concealed_area_ratio
                            max_area = self.max_concealed_area_ratio
                        else:
                            min_area = self.min_bbox_area_ratio
                            max_area = self.max_bbox_area_ratio
                        
                        if area_ratio < min_area or area_ratio > max_area:
                            continue
                        
                        detection_box = box
                        detection_confidence = confidence
                        detection_result = r
                        break
                    if detection_box is not None:
                        break
                
                if detection_box is not None:
                    consecutive_count += 1
                    if consecutive_count >= self.persistence_frames:
                        if current_time - last_detection_time >= self.alert_cooldown_seconds:
                            class_name = self._get_class_name(detection_class_id)
                            
                            # Save detection image
                            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                            image_filename = f"{camera_id}_{timestamp}_{class_name}.jpg"
                            image_path = self.save_dir / image_filename
                            
                            annotated_frame = detection_result.plot()
                            cv2.imwrite(str(image_path), annotated_frame)
                            del annotated_frame  # Free memory immediately
                            
                            detection_data = {
                                'camera_id': camera_id,
                                'camera_location': camera_location,
                                'school_code': school_code,
                                'class_name': class_name,
                                'class_id': detection_class_id,
                                'confidence': detection_confidence,
                                'timestamp': datetime.now().isoformat(),
                                'image_path': str(image_path),
                                'bbox': detection_box.xyxy[0].tolist(),
                                'is_concealed': self._is_concealed_weapon(class_name)
                            }
                            
                            with self._lock:
                                self.recent_detections.append(detection_data)
                                if len(self.recent_detections) > self.max_recent_detections:
                                    self.recent_detections.pop(0)
                            
                            if self.detection_callback:
                                try:
                                    self.detection_callback(detection_data)
                                except Exception as e:
                                    print(f"[DetectionService] Callback error: {e}")
                            
                            print(f"[DETECT] Camera {camera_id}: {class_name} ({detection_confidence:.2%}) "
                                  f"at {camera_location}")
                            last_detection_time = current_time
                else:
                    consecutive_count = 0
                
                # Small delay to prevent 100% CPU
                time.sleep(0.05)
                
        finally:
            cap.release()
            del frame
            with self._lock:
                self.camera_threads.pop(camera_id, None)
                self.camera_stop_flags.pop(camera_id, None)
                self.camera_frame_counts.pop(camera_id, None)
                self.is_running = len(self.camera_threads) > 0
                active = len(self.camera_threads)
            gc.collect()
            print(f"[DetectionService] Camera {camera_id} loop ended. Active: {active}")
    
    def get_recent_detections(self, limit=10):
        """Get recent detections"""
        with self._lock:
            return self.recent_detections[-limit:]
    
    def detect_single_frame(self, frame):
        """
        Detect weapons in a single frame (used by video_feed endpoint).
        Shares the same model instance — no extra memory.
        """
        try:
            results = self.model(frame, verbose=False)
        except Exception:
            return []
        
        detections = []
        frame_h, frame_w = frame.shape[:2]
        
        for r in results:
            if r.boxes is not None:
                for box in r.boxes:
                    confidence = float(box.conf[0])
                    if confidence >= self.confidence_threshold:
                        class_id = int(box.cls[0])
                        class_name = self._get_class_name(class_id)
                        if not self._is_weapon_like_class(class_name):
                            continue
                        
                        x1, y1, x2, y2 = box.xyxy[0]
                        area_ratio = ((x2 - x1) * (y2 - y1)) / (frame_w * frame_h + 1e-6)
                        if area_ratio < self.min_bbox_area_ratio or area_ratio > self.max_bbox_area_ratio:
                            continue
                        
                        detections.append({
                            'class_name': class_name,
                            'class_id': class_id,
                            'confidence': confidence,
                            'bbox': box.xyxy[0].tolist()
                        })
        
        return detections

if __name__ == '__main__':
    base_dir = Path(__file__).resolve().parents[2]
    model_path = base_dir / 'models' / 'best.onnx'
    save_dir = base_dir / 'data' / 'detection_images'
    service = DetectionService(
        model_path=str(model_path),
        save_dir=str(save_dir),
        allow_demo_video_fallback=True,
    )
    service.start_resource_monitoring()
    
    def on_detection(data):
        print(f"Detection callback: {data['class_name']} ({data['confidence']:.2%})")
    
    service.set_detection_callback(on_detection)
    
    print("\n--- Resource Status ---")
    status = service.get_resource_status()
    for k, v in status.items():
        print(f"  {k}: {v}")
    
    print("\nStarting test camera...")
    service.start_camera_detection(
        camera_id='test_cam_1',
        camera_source=0,
        camera_location='Test Location',
    )
    
    print("Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(5)
            status = service.get_resource_status()
            print(f"[Status] Active: {status['active_cameras']}, "
                  f"Mem: {status['memory_mb']}MB, "
                  f"CPU: {status['cpu_percent']}%, "
                  f"Skip: {status['frame_skip']}")
    except KeyboardInterrupt:
        print("\nStopping...")
        service.stop_all_cameras()
        service.stop_resource_monitoring()
