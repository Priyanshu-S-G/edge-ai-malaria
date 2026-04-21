import cv2
import numpy as np


# -------------------- CONFIG --------------------
TARGET_SIZE = (224, 224)

HSV_LOWER = np.array([125, 50, 30], dtype=np.uint8)
HSV_UPPER = np.array([155, 255, 255], dtype=np.uint8)

MIN_OBJECT_AREA = 40
MORPH_KERNEL_SIZE = 3
# ------------------------------------------------


def _resize(img: np.ndarray) -> np.ndarray:
    return cv2.resize(img, TARGET_SIZE, interpolation=cv2.INTER_AREA)


def _white_balance(img: np.ndarray) -> np.ndarray:
    img = img.astype(np.float32) + 1e-6

    avg_r = np.mean(img[:, :, 0])
    avg_g = np.mean(img[:, :, 1])
    avg_b = np.mean(img[:, :, 2])
    avg_gray = (avg_r + avg_g + avg_b) / 3.0

    img[:, :, 0] *= avg_gray / avg_r
    img[:, :, 1] *= avg_gray / avg_g
    img[:, :, 2] *= avg_gray / avg_b

    return np.clip(img, 0, 255).astype(np.uint8)


def _clahe(img: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)

    lab = cv2.merge((l, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)


def _extract_hsv_mask(img: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    return cv2.inRange(hsv, HSV_LOWER, HSV_UPPER)


def _morphological_cleanup(mask: np.ndarray) -> np.ndarray:
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE, (MORPH_KERNEL_SIZE, MORPH_KERNEL_SIZE)
    )

    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    # remove small objects via contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    cleaned = np.zeros_like(mask)
    for cnt in contours:
        if cv2.contourArea(cnt) >= MIN_OBJECT_AREA:
            cv2.drawContours(cleaned, [cnt], -1, 255, -1)

    return cleaned


def preprocess_image(img: np.ndarray) -> np.ndarray:
    """
    Input:
        RGB image (H, W, 3)

    Output:
        Masked RGB image (224, 224, 3)
    """
    if img is None or not isinstance(img, np.ndarray):
        raise ValueError("Invalid image input")

    if img.ndim != 3 or img.shape[2] != 3:
        raise ValueError("Expected RGB image with shape (H, W, 3)")

    # Step 1: resize
    img = _resize(img)

    # Step 2: white balance
    img = _white_balance(img)

    # Step 3: CLAHE
    img = _clahe(img)

    # Step 4: HSV mask
    mask = _extract_hsv_mask(img)

    # Step 5: cleanup
    mask = _morphological_cleanup(mask)

    # Step 6: apply mask
    mask_3ch = cv2.merge([mask, mask, mask])
    output = cv2.bitwise_and(img, mask_3ch)

    return output