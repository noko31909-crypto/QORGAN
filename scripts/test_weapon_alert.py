#!/usr/bin/env python3
"""
Script for testing weapon-detection notifications
"""
import cv2
import requests
import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / 'apps' / 'backend'
sys.path.insert(0, str(BACKEND_DIR))

from detection_service import DetectionService

# Configuration
API_URL = "http://127.0.0.1:5001/api"
TEST_IMAGE = str(ROOT_DIR / 'data' / 'results' / 'teste.jpg')
MODEL_PATH = str(ROOT_DIR / 'models' / 'best.onnx')

def test_detection_with_image():
    """Test detection on an existing image"""
    print("Loading YOLOv8 model...")
    detection_service = DetectionService(model_path=MODEL_PATH)
    
    print(f"Loading image: {TEST_IMAGE}")
    frame = cv2.imread(TEST_IMAGE)
    
    if frame is None:
        print(f"Error: could not load image {TEST_IMAGE}")
        return
    
    print("Running detection...")
    results = detection_service.detect_single_frame(frame)
    
    if results:
        print(f"\nDetected {len(results)} object(s):")
        for i, det in enumerate(results, 1):
            print(f"  {i}. {det['class_name']}: {det['confidence']:.2%}")
            print(f"     bbox: {det['bbox']}")
        print(f"\nNotification: Weapon detected, confidence {results[0]['confidence']:.2%}, camera Test Camera.")
    else:
        print("No weapon detected in image.")

def test_api_status():
    """Check API status"""
    print("\nChecking backend...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("Backend OK.")
            data = response.json()
            print(f"   Status: {data.get('status')}")
        else:
            print(f"Backend returned: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("Backend not running. Start: python3 apps/backend/app.py")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Test: weapon detection system")
    print("=" * 60)
    
    # 1. Check API
    test_api_status()
    
    # 2. Test detection
    print("\n" + "="*60)
    test_detection_with_image()
    
    print("\nTo test in app: run backend, open app as Guard, check School Safety and Notifications.")
    print("=" * 60)
