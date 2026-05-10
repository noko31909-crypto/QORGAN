import cv2
from ultralytics import YOLO
import threading
import time
from datetime import datetime
from pathlib import Path

class DetectionService:
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
            persistence_frames: How many consecutive frames must contain a weapon before alerting
            alert_cooldown_seconds: Cooldown between alerts per camera
            min_bbox_area_ratio: Ignore detections smaller than this fraction of frame area
            max_bbox_area_ratio: Ignore detections larger than this fraction of frame area
            allow_demo_video_fallback: If True and camera fails to open, use bundled demo MP4 (not for production centers).
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
        self.allowed_keywords = {'weapon', 'knife', 'gun', 'rifle', 'pistol', 'firearm', 'handgun', 'shotgun'}
        
        # Create directory for saving detection images
        self.save_dir = Path(save_dir) if save_dir else Path('detection_images')
        self.save_dir.mkdir(parents=True, exist_ok=True)
        
        self._load_model()
    
    def _load_model(self):
        """Load YOLO model"""
        try:
            self.model = YOLO(self.model_path, task='detect')
            print(f"Model loaded successfully from {self.model_path}")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise
    
    def set_detection_callback(self, callback):
        """Set callback function to be called when weapon is detected"""
        self.detection_callback = callback

    def _get_class_name(self, class_id):
        FALLBACK_NAMES = {0: 'knife', 1: 'gun', 2: 'weapon'}
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

        # If model labels are unavailable and class names come as class_<id>,
        # do not hard-filter them out in demo mode.
        if lowered.startswith('class_'):
            return True

        return any(k in lowered for k in self.allowed_keywords)
    
    def start_camera_detection(self, camera_id, camera_source, camera_location='Unknown', school_code=None):
        """
        Start detection on a specific camera

        Args:
            camera_id: Unique camera identifier
            camera_source: Camera source (0 for webcam, or RTSP URL)
            camera_location: Physical location of camera
            school_code: School code for the camera
        """
        with self._lock:
            if camera_id in self.camera_threads:
                print(f"Camera {camera_id} is already running")
                return
            stop_event = threading.Event()
            self.camera_stop_flags[camera_id] = stop_event

        thread = threading.Thread(
            target=self._detection_loop,
            args=(camera_id, camera_source, camera_location, stop_event, school_code),
            daemon=True
        )
        thread.start()
        with self._lock:
            self.camera_threads[camera_id] = thread
        print(f"Started detection on camera {camera_id}")
    
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
        print(f"Stopped detection on camera {camera_id}")
    
    def _open_capture(self, camera_source):
        cap = cv2.VideoCapture(camera_source)
        if cap.isOpened():
            return cap, str(camera_source)

        if self.allow_demo_video_fallback and self.demo_video.exists():
            demo_cap = cv2.VideoCapture(str(self.demo_video))
            if demo_cap.isOpened():
                print(f"Using demo video fallback: {self.demo_video}")
                return demo_cap, str(self.demo_video)

        return cap, str(camera_source)

    def _detection_loop(self, camera_id, camera_source, camera_location, stop_event, school_code=None):
        """Main detection loop for a camera"""
        cap, used_source = self._open_capture(camera_source)
        
        if not cap.isOpened():
            print(f"Error: Could not open camera {camera_id}")
            return

        print(f"Camera {camera_id} source: {used_source}")
        last_detection_time = 0
        consecutive_count = 0  # counts consecutive frames with a valid weapon detection

        try:
            self.is_running = True
            while not stop_event.is_set():
                ret, frame = cap.read()
                if not ret:
                    # Loop demo video for deterministic demo mode.
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    consecutive_count = 0
                    time.sleep(0.1)
                    continue

                # Run detection
                results = self.model(frame, verbose=False)

                current_time = time.time()
                frame_h, frame_w = frame.shape[:2]
                detection_box = None
                detection_class_id = None
                detection_confidence = None
                detection_result = None

                # Find first box above confidence threshold (we only need to know that the frame is "positive")
                for r in results:
                    if r.boxes is None or len(r.boxes) == 0:
                        continue
                    for box in r.boxes:
                        confidence = float(box.conf[0])
                        if confidence < self.confidence_threshold:
                            continue

                        # Area filter to drop tiny/huge false positives
                        x1, y1, x2, y2 = box.xyxy[0]
                        area_ratio = ((x2 - x1) * (y2 - y1)) / (frame_w * frame_h + 1e-6)
                        if area_ratio < self.min_bbox_area_ratio or area_ratio > self.max_bbox_area_ratio:
                            continue

                        detection_class_id = int(box.cls[0])
                        class_name = self._get_class_name(detection_class_id)
                        if not self._is_weapon_like_class(class_name):
                            continue

                        detection_box = box
                        detection_confidence = confidence
                        detection_result = r
                        break
                    if detection_box is not None:
                        break

                if detection_box is not None:
                    consecutive_count += 1
                    # Require N consecutive positive frames before firing alert
                    if consecutive_count >= self.persistence_frames:
                        # Cooldown check to avoid spamming alerts for same object
                        if current_time - last_detection_time >= self.alert_cooldown_seconds:
                            class_name = self._get_class_name(detection_class_id)

                            # Save detection image with annotated boxes
                            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                            image_filename = f"{camera_id}_{timestamp}_{class_name}.jpg"
                            image_path = self.save_dir / image_filename

                            annotated_frame = detection_result.plot()
                            cv2.imwrite(str(image_path), annotated_frame)

                            detection_data = {
                                'camera_id': camera_id,
                                'camera_location': camera_location,
                                'school_code': school_code,
                                'class_name': class_name,
                                'class_id': detection_class_id,
                                'confidence': detection_confidence,
                                'timestamp': datetime.now().isoformat(),
                                'image_path': str(image_path),
                                'bbox': detection_box.xyxy[0].tolist()
                            }

                            with self._lock:
                                self.recent_detections.append(detection_data)
                                if len(self.recent_detections) > self.max_recent_detections:
                                    self.recent_detections.pop(0)

                            if self.detection_callback:
                                try:
                                    self.detection_callback(detection_data)
                                except Exception as e:
                                    print(f"Error in detection callback: {e}")

                            print(f"WEAPON DETECTED: {class_name} ({detection_confidence:.2%}) at {camera_location}")
                            last_detection_time = current_time
                else:
                    # Reset counter if this frame had no valid detections
                    consecutive_count = 0

                # Small delay to prevent CPU overload
                time.sleep(0.1)
        finally:
            cap.release()
            with self._lock:
                self.camera_threads.pop(camera_id, None)
                self.camera_stop_flags.pop(camera_id, None)
                self.is_running = len(self.camera_threads) > 0
            print(f"Detection loop ended for camera {camera_id}")
    
    def get_recent_detections(self, limit=10):
        """Get recent detections"""
        with self._lock:
            return self.recent_detections[-limit:]
    
    def detect_single_frame(self, frame):
        """
        Detect weapons in a single frame
        
        Args:
            frame: OpenCV frame/image
            
        Returns:
            List of detections
        """
        results = self.model(frame, verbose=False)
        detections = []
        
        for r in results:
            if r.boxes is not None:
                frame_h, frame_w = frame.shape[:2]
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
    # Test the detection service
    base_dir = Path(__file__).resolve().parents[2]
    model_path = base_dir / 'models' / 'best.onnx'
    save_dir = base_dir / 'data' / 'detection_images'
    service = DetectionService(
        model_path=str(model_path),
        save_dir=str(save_dir),
        allow_demo_video_fallback=True,
    )
    
    def on_detection(data):
        print(f"Detection callback: {data}")
    
    service.set_detection_callback(on_detection)
    service.start_camera_detection(
        camera_id='test_cam_1',
        camera_source=0,
        camera_location='Test Location'
    )
    
    print("Detection service running. Press Ctrl+C to stop...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping...")
