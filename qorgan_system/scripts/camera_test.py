#!/usr/bin/env python3
"""
Quick webcam/RTSP test viewer with live detections.

Usage examples:
  python3 scripts/camera_test.py               # webcam 0
  python3 scripts/camera_test.py --source rtsp://user:pass@ip/stream
  python3 scripts/camera_test.py --threshold 0.8

Shows bounding boxes and a center circle for each detection above threshold.
Press 'q' to quit.
"""
import argparse
import time
from pathlib import Path

import cv2
from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="Camera detection test viewer")
    parser.add_argument('--source', default='0', help='Camera index or RTSP/HTTP video URL (default: 0)')
    parser.add_argument('--model', default=str(Path(__file__).resolve().parents[1] / 'models' / 'best.onnx'),
                        help='Path to ONNX model (default: models/best.onnx)')
    parser.add_argument('--threshold', type=float, default=0.7, help='Confidence threshold (default: 0.7)')
    parser.add_argument('--width', type=int, default=0, help='Optional resize width (keeps aspect ratio)')
    return parser.parse_args()


def main():
    args = parse_args()

    # Resolve numeric camera id if possible
    try:
        source = int(args.source)
    except ValueError:
        source = args.source

    print(f"Opening source: {source}")
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise SystemExit(f"Failed to open source: {source}")

    print(f"Loading model: {args.model}")
    model = YOLO(args.model, task='detect')

    delay_ms = 1
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Stream ended / cannot read frame")
                break

            if args.width and frame.shape[1] != args.width:
                h, w = frame.shape[:2]
                new_h = int(h * (args.width / w))
                frame = cv2.resize(frame, (args.width, new_h))

            results = model(frame, verbose=False, conf=args.threshold)
            annotated = frame

            if results:
                r = results[0]
                annotated = r.plot()  # let ultralytics draw boxes/labels

                if r.boxes is not None:
                    for box in r.boxes:
                        conf = float(box.conf[0])
                        if conf < args.threshold:
                            continue
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                        cv2.circle(annotated, (cx, cy), 8, (0, 0, 255), 2)
            else:
                cv2.putText(annotated, "No detections", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)

            cv2.imshow('Weapon detection test (q to quit)', annotated)
            key = cv2.waitKey(delay_ms) & 0xFF
            if key == ord('q'):
                break
            # Small sleep to ease CPU load if needed
            time.sleep(0.001)
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == '__main__':
    main()
