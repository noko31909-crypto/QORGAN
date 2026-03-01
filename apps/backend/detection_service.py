import cv2
from ultralytics import YOLO
import threading
import time
import numpy as np
from datetime import datetime
from pathlib import Path

class DetectionService:
    def __init__(self, model_path, confidence_threshold=0.5, save_dir=None):
        """
        Initialize weapon detection service
        
        Args:
            model_path: Path to YOLO model
            confidence_threshold: Minimum confidence for detection
            save_dir: Directory to store detection images
        """
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.is_running = False
        self.detection_callback = None
        self.recent_detections = []
        self.max_recent_detections = 50
        self.camera_threads = {}
        
        # Create directory for saving detection images
        self.save_dir = Path(save_dir) if save_dir else Path('detection_images')
        self.save_dir.mkdir(parents=True, exist_ok=True)
        
        self._load_model()
    
    def _load_model(self):
        """Load YOLO model"""
        try:
            self.model = YOLO(self.model_path)
            print(f"Model loaded successfully from {self.model_path}")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise
    
    def set_detection_callback(self, callback):
        """Set callback function to be called when weapon is detected"""
        self.detection_callback = callback
    
    def start_camera_detection(self, camera_id, camera_source, camera_location='Unknown'):
        """
        Start detection on a specific camera
        
        Args:
            camera_id: Unique camera identifier
            camera_source: Camera source (0 for webcam, or RTSP URL)
            camera_location: Physical location of camera
        """
        if camera_id in self.camera_threads:
            print(f"Camera {camera_id} is already running")
            return
        
        thread = threading.Thread(
            target=self._detection_loop,
            args=(camera_id, camera_source, camera_location),
            daemon=True
        )
        thread.start()
        self.camera_threads[camera_id] = thread
        print(f"Started detection on camera {camera_id}")
    
    def stop_camera_detection(self, camera_id):
        """Stop detection on a specific camera"""
        if camera_id in self.camera_threads:
            del self.camera_threads[camera_id]
            print(f"Stopped detection on camera {camera_id}")
    
    def _detection_loop(self, camera_id, camera_source, camera_location):
        """Main detection loop for a camera"""
        cap = cv2.VideoCapture(camera_source)
        
        if not cap.isOpened():
            print(f"Error: Could not open camera {camera_id}")
            return
        
        self.is_running = True
        last_detection_time = 0
        detection_cooldown = 3  # seconds between alerts for same camera
        
        while camera_id in self.camera_threads:
            ret, frame = cap.read()
            if not ret:
                print(f"Error reading frame from camera {camera_id}")
                time.sleep(1)
                continue
            
            # Run detection
            results = self.model(frame, verbose=False)
            
            current_time = time.time()
            
            for r in results:
                if r.boxes is not None and len(r.boxes) > 0:
                    boxes = r.boxes
                    
                    for box in boxes:
                        confidence = float(box.conf[0])
                        
                        if confidence >= self.confidence_threshold:
                            # Cooldown check
                            if current_time - last_detection_time < detection_cooldown:
                                continue
                            
                            class_id = int(box.cls[0])
                            class_name = self.model.names[class_id]
                            
                            # Save detection image
                            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                            image_filename = f"{camera_id}_{timestamp}_{class_name}.jpg"
                            image_path = self.save_dir / image_filename
                            
                            # Draw box on frame
                            annotated_frame = r.plot()
                            cv2.imwrite(str(image_path), annotated_frame)
                            
                            # Prepare detection data
                            detection_data = {
                                'camera_id': camera_id,
                                'camera_location': camera_location,
                                'class_name': class_name,
                                'class_id': class_id,
                                'confidence': confidence,
                                'timestamp': datetime.now().isoformat(),
                                'image_path': str(image_path),
                                'bbox': box.xyxy[0].tolist()
                            }
                            
                            # Add to recent detections
                            self.recent_detections.append(detection_data)
                            if len(self.recent_detections) > self.max_recent_detections:
                                self.recent_detections.pop(0)
                            
                            # Call callback if set
                            if self.detection_callback:
                                try:
                                    self.detection_callback(detection_data)
                                except Exception as e:
                                    print(f"Error in detection callback: {e}")
                            
                            print(f"🚨 WEAPON DETECTED: {class_name} ({confidence:.2%}) at {camera_location}")
                            
                            last_detection_time = current_time
            
            # Small delay to prevent CPU overload
            time.sleep(0.1)
        
        cap.release()
        self.is_running = False
        print(f"Detection loop ended for camera {camera_id}")
    
    def get_recent_detections(self, limit=10):
        """Get recent detections"""
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
                for box in r.boxes:
                    confidence = float(box.conf[0])
                    if confidence >= self.confidence_threshold:
                        class_id = int(box.cls[0])
                        detections.append({
                            'class_name': self.model.names[class_id],
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
    service = DetectionService(model_path=str(model_path), save_dir=str(save_dir))
    
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
