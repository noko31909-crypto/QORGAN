#!/usr/bin/env python3
"""
Qorgan — Model Evaluation Script
Measures detection performance on the local image dataset.
Uses onnxruntime + opencv directly (no ultralytics dependency).

Usage:
  python3 scripts/eval_model.py

Images in data/detection_images/:
  - Files starting with "1_" = ground truth WEAPON (positive)
  - Files starting with "0_" = ground truth CLEAN  (negative)
"""

from __future__ import annotations
import time
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "models" / "best.onnx"
IMAGES_DIR = ROOT / "data" / "detection_images"
THRESHOLDS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
MAIN_THRESHOLD = 0.5   # production threshold in detection_service.py
INPUT_SIZE = 640        # YOLOv8 default


def preprocess(img_path: Path) -> tuple[np.ndarray, int, int]:
    """Load and letterbox-pad image to INPUT_SIZE x INPUT_SIZE."""
    img = cv2.imread(str(img_path))
    if img is None:
        raise ValueError(f"Cannot read {img_path}")
    h, w = img.shape[:2]
    scale = INPUT_SIZE / max(h, w)
    nh, nw = int(h * scale), int(w * scale)
    resized = cv2.resize(img, (nw, nh))
    canvas = np.full((INPUT_SIZE, INPUT_SIZE, 3), 114, dtype=np.uint8)
    canvas[:nh, :nw] = resized
    blob = canvas[:, :, ::-1].astype(np.float32) / 255.0   # BGR→RGB, normalise
    blob = blob.transpose(2, 0, 1)[np.newaxis]              # HWC → 1CHW
    return blob, h, w


def run_inference(session: ort.InferenceSession, img_path: Path) -> float:
    """Return max confidence score over all predicted boxes."""
    blob, _, _ = preprocess(img_path)
    input_name = session.get_inputs()[0].name
    t0 = time.perf_counter()
    outputs = session.run(None, {input_name: blob})
    elapsed_ms = (time.perf_counter() - t0) * 1000

    # YOLOv8 ONNX output shape: [1, num_classes+4, num_anchors]
    # confidence is max over class columns (indices 4:)
    preds = outputs[0]  # (1, 84, 8400) typical
    if preds.ndim == 3:
        preds = preds[0]          # (84, 8400)
        if preds.shape[0] < preds.shape[1]:
            # (classes+4, anchors) — transpose to (anchors, classes+4)
            preds = preds.T
        confidences = preds[:, 4:].max(axis=1)
    else:
        confidences = np.array([0.0])

    return float(confidences.max()), elapsed_ms


def main() -> None:
    if not MODEL_PATH.exists():
        print(f"ERROR: Model not found at {MODEL_PATH}")
        return

    print("=" * 60)
    print("QORGAN — MODEL EVALUATION  (onnxruntime)")
    print(f"Model:  {MODEL_PATH.name}")
    print(f"Images: {IMAGES_DIR}")
    print("=" * 60)

    session = ort.InferenceSession(
        str(MODEL_PATH),
        providers=["CPUExecutionProvider"],
    )

    weapon_images = sorted(IMAGES_DIR.glob("1_*.jpg"))
    clean_images  = sorted(IMAGES_DIR.glob("0_*.jpg"))
    all_images = [(p, 1) for p in weapon_images] + [(p, 0) for p in clean_images]

    if not all_images:
        print("ERROR: No images found in data/detection_images/")
        return

    print(f"\nDataset: {len(weapon_images)} weapon images, {len(clean_images)} clean images")

    # --- Inference ---
    image_results: dict[Path, tuple[int, float]] = {}
    inference_times: list[float] = []

    print("Running inference...")
    for img_path, label in all_images:
        try:
            max_conf, ms = run_inference(session, img_path)
        except Exception as e:
            print(f"  SKIP {img_path.name}: {e}")
            continue
        inference_times.append(ms)
        image_results[img_path] = (label, max_conf)

    if not inference_times:
        print("ERROR: No images processed successfully.")
        return

    avg_ms = round(sum(inference_times) / len(inference_times), 1)
    print(f"Done. Average inference: {avg_ms} ms/image\n")

    # --- Per-threshold table ---
    print(f"{'Threshold':<12} {'TP':<6} {'FP':<6} {'FN':<6} {'TN':<6} "
          f"{'Recall':<10} {'Precision':<12} {'F1':<8} {'FP Rate'}")
    print("-" * 80)

    for thresh in THRESHOLDS:
        TP = FP = FN = TN = 0
        for img_path, (label, max_conf) in image_results.items():
            predicted = 1 if max_conf >= thresh else 0
            if   label == 1 and predicted == 1: TP += 1
            elif label == 0 and predicted == 1: FP += 1
            elif label == 1 and predicted == 0: FN += 1
            else:                               TN += 1

        recall    = TP / (TP + FN) if (TP + FN) > 0 else 0.0
        precision = TP / (TP + FP) if (TP + FP) > 0 else 0.0
        f1        = 2*precision*recall / (precision+recall) if (precision+recall) > 0 else 0.0
        fp_rate   = FP / (FP + TN)  if (FP + TN) > 0 else 0.0

        marker = " ← production" if thresh == MAIN_THRESHOLD else ""
        print(f"{thresh:<12.1f} {TP:<6} {FP:<6} {FN:<6} {TN:<6} "
              f"{recall:<10.3f} {precision:<12.3f} {f1:<8.3f} {fp_rate:.3f}{marker}")

    # --- Failure cases ---
    print(f"\nFAILURE CASES at threshold={MAIN_THRESHOLD}:")
    failures = []
    for img_path, (label, max_conf) in image_results.items():
        predicted = 1 if max_conf >= MAIN_THRESHOLD else 0
        if label != predicted:
            kind = "FN (missed weapon)" if label == 1 else "FP (false alarm)"
            failures.append((kind, img_path.name, round(max_conf, 3)))

    if failures:
        for kind, name, conf in failures:
            print(f"  {kind}: {name}  (conf={conf})")
    else:
        print("  None — all images correctly classified.")

    # --- Judge summary ---
    TP = FP = FN = TN = 0
    for img_path, (label, max_conf) in image_results.items():
        predicted = 1 if max_conf >= MAIN_THRESHOLD else 0
        if   label == 1 and predicted == 1: TP += 1
        elif label == 0 and predicted == 1: FP += 1
        elif label == 1 and predicted == 0: FN += 1
        else:                               TN += 1

    recall    = TP / (TP + FN) if (TP + FN) > 0 else 0.0
    precision = TP / (TP + FP) if (TP + FP) > 0 else 0.0
    f1        = 2*precision*recall / (precision+recall) if (precision+recall) > 0 else 0.0

    print("\n" + "=" * 60)
    print("JUDGE-READY SUMMARY")
    print("=" * 60)
    print(f"Model:                {MODEL_PATH.name}")
    print(f"Test set:             {len(all_images)} ({len(weapon_images)} weapon, {len(clean_images)} clean)")
    print(f"Production threshold: {MAIN_THRESHOLD}")
    print(f"Recall:               {recall:.3f}  ({TP}/{TP+FN} weapon images detected)")
    if len(clean_images) > 0:
        print(f"Precision:            {precision:.3f}  ({TP}/{TP+FP} detections correct)")
        print(f"F1 Score:             {f1:.3f}")
        fp_rate = FP / (FP + TN) if (FP + TN) > 0 else 0.0
        print(f"FP Rate:              {fp_rate:.3f}  ({FP}/{FP+TN} clean images triggered)")
    else:
        print("Precision:            N/A (no clean images)")
    print(f"Avg inference:        {avg_ms} ms/image")
    print("=" * 60)
    print("\nThreshold decision: 0.5 chosen because in a school context,")
    print("missing a real threat (FN) is more dangerous than a false alarm (FP).")
    print("Guards confirm before escalation — human-in-the-loop failsafe.")


if __name__ == "__main__":
    main()
