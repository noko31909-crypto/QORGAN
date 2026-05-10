import argparse
from pathlib import Path

import cv2
import numpy as np
import pywt


SUPPORTED_EXTENSIONS = (".png", ".jpg", ".jpeg", ".bmp")
ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = ROOT_DIR / "data" / "images" / "Normal" / "Test" / "images"
DEFAULT_OUTPUT = ROOT_DIR / "data" / "images" / "Haar_Compressed" / "Test" / "images"


def apply_wavelet_transform(image: np.ndarray, wavelet: str) -> np.ndarray:
    coeffs2 = pywt.dwt2(image, wavelet)
    _, (lh, _, _) = coeffs2
    return lh


def enhance_contrast(image: np.ndarray) -> np.ndarray:
    min_val = float(np.min(image))
    max_val = float(np.max(image))
    if max_val <= min_val:
        return np.zeros_like(image, dtype=np.uint8)
    normalized_image = ((image - min_val) / (max_val - min_val)) * 255.0
    return normalized_image.astype(np.uint8)


def process_images_in_folder(
    input_folder: Path,
    output_folder: Path,
    wavelet: str,
    output_size: int,
    jpeg_quality: int,
) -> None:
    if not input_folder.exists():
        raise FileNotFoundError(f"Input folder does not exist: {input_folder}")

    output_folder.mkdir(parents=True, exist_ok=True)
    image_files = sorted([p for p in input_folder.iterdir() if p.suffix.lower() in SUPPORTED_EXTENSIONS])

    if not image_files:
        print(f"No images found in {input_folder}")
        return

    for image_path in image_files:
        original = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
        if original is None:
            print(f"Skipped unreadable file: {image_path}")
            continue

        horizontal_detail = apply_wavelet_transform(original, wavelet)
        horizontal_detail = enhance_contrast(horizontal_detail)
        horizontal_detail = cv2.resize(horizontal_detail, (output_size, output_size), interpolation=cv2.INTER_AREA)

        output_path = output_folder / image_path.name
        if output_path.suffix.lower() in {".jpg", ".jpeg"}:
            cv2.imwrite(str(output_path), horizontal_detail, [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality])
        else:
            cv2.imwrite(str(output_path), horizontal_detail)
        print(f"Saved transformed image to {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Apply wavelet-based preprocessing to all images in a folder.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Input folder with source images.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output folder for transformed images.")
    parser.add_argument(
        "--wavelet",
        choices=["haar", "db2", "sym2"],
        default="haar",
        help="Wavelet family to use for DWT.",
    )
    parser.add_argument("--size", type=int, default=640, help="Square output size in pixels.")
    parser.add_argument(
        "--jpeg-quality",
        type=int,
        default=20,
        help="JPEG quality for .jpg/.jpeg outputs (1..100).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    quality = max(1, min(100, args.jpeg_quality))
    process_images_in_folder(args.input, args.output, args.wavelet, args.size, quality)


if __name__ == "__main__":
    main()
