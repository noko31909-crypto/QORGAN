import cv2
from ultralytics import YOLO
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = str(ROOT_DIR / "models" / "best.onnx")
CAMERA_SOURCE = 0  # 0 = webcam

def main():
    model = YOLO(MODEL_PATH)
    cap = cv2.VideoCapture(CAMERA_SOURCE)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        results = model(frame, verbose=False)

        for r in results:
            if r.boxes is not None:
                frame = r.plot()

        cv2.imshow("Weapon Detection - Camera Test", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
