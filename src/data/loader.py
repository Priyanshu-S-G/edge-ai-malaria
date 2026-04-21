import os
from typing import List, Tuple
import cv2
import numpy as np


def load_image_paths(root_dir: str):
    """
    Load image file paths and corresponding labels.

    Assumes:
        root/
            class_0/
            class_1/

    Returns:
        List of (image_path, label)
    """
    if not os.path.isdir(root_dir):
        raise ValueError(f"Invalid directory: {root_dir}")

    class_dirs = sorted([
        d for d in os.listdir(root_dir)
        if os.path.isdir(os.path.join(root_dir, d))
    ])

    image_paths = []

    for label, class_name in enumerate(class_dirs):
        class_path = os.path.join(root_dir, class_name)

        for file_name in os.listdir(class_path):
            file_path = os.path.join(class_path, file_name)

            if (
                os.path.isfile(file_path)
                and file_name.lower().endswith((".png", ".jpg", ".jpeg"))
            ):
                image_paths.append((file_path, label))

    return image_paths


def read_image(path: str) -> np.ndarray:
    """
    Read image using OpenCV and convert BGR to RGB.

    Returns:
        np.ndarray (H, W, 3) in RGB
    """
    img = cv2.imread(path)

    if img is None:
        raise ValueError(f"Failed to read image: {path}")

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return img