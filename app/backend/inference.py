"""
Inference engine for malaria detection.

Model path resolution (edit MODEL_DIR / METRICS_PATH to match your deployment):
  models/trained/mobilenet_pre.pth
  models/trained/efficientnet_pre.pth
  models/quantized/mobilenet_quant.pth
  models/quantized/efficientnet_quant.pth
"""

import os
import io
import csv
import time
import numpy as np
import cv2
import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small, efficientnet_b0
from pathlib import Path

# ── Path config ────────────────────────────────────────────────────────────────
# Adjust these to point at your actual files.
# Default: repo root is two levels above app/backend/
_REPO_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATHS = {
    "mobilenet_pre":      _REPO_ROOT / "models" / "trained"    / "mobilenet_pre.pth",
    "efficientnet_pre":   _REPO_ROOT / "models" / "trained"    / "efficientnet_pre.pth",
    "mobilenet_quant":    _REPO_ROOT / "models" / "quantized"  / "mobilenet_quant.pth",
    "efficientnet_quant": _REPO_ROOT / "models" / "quantized"  / "efficientnet_quant.pth",
}

METRICS_PATH = _REPO_ROOT / "results" / "metrics.csv"

LABELS = ["Parasitized", "Uninfected"]
IMG_SIZE = (224, 224)

# ── Preprocessing (mirrors preprocessing.py) ───────────────────────────────────
HSV_LOWER = np.array([125, 50, 30], dtype=np.uint8)
HSV_UPPER = np.array([155, 255, 255], dtype=np.uint8)
MIN_OBJECT_AREA = 40
MORPH_KERNEL_SIZE = 3


def _white_balance(img: np.ndarray) -> np.ndarray:
    img = img.astype(np.float32) + 1e-6
    avg = img.mean(axis=(0, 1))
    avg_gray = avg.mean()
    img *= avg_gray / avg
    return np.clip(img, 0, 255).astype(np.uint8)


def _clahe(img: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lab = cv2.merge((clahe.apply(l), a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)


def _hsv_mask(img: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    mask = cv2.inRange(hsv, HSV_LOWER, HSV_UPPER)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (MORPH_KERNEL_SIZE, MORPH_KERNEL_SIZE))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cleaned = np.zeros_like(mask)
    for cnt in contours:
        if cv2.contourArea(cnt) >= MIN_OBJECT_AREA:
            cv2.drawContours(cleaned, [cnt], -1, 255, -1)
    return cleaned


def preprocess_image(img: np.ndarray) -> np.ndarray:
    img = cv2.resize(img, IMG_SIZE, interpolation=cv2.INTER_AREA)
    img = _white_balance(img)
    img = _clahe(img)
    mask = _hsv_mask(img)
    mask_3ch = cv2.merge([mask, mask, mask])
    return cv2.bitwise_and(img, mask_3ch)


def to_tensor(img: np.ndarray) -> torch.Tensor:
    img = cv2.resize(img, IMG_SIZE)
    tensor = torch.tensor(img / 255.0, dtype=torch.float32).permute(2, 0, 1)
    return tensor.unsqueeze(0)  # (1, 3, H, W)


# ── Model builders ─────────────────────────────────────────────────────────────

def _build_mobilenet(num_classes=2) -> nn.Module:
    model = mobilenet_v3_small(weights=None)
    model.classifier[-1] = nn.Linear(model.classifier[-1].in_features, num_classes)
    return model


def _build_efficientnet(num_classes=2) -> nn.Module:
    model = efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    return model


# ── Inference engine ───────────────────────────────────────────────────────────

class InferenceEngine:
    def __init__(self):
        self._models: dict[str, nn.Module] = {}
        self._load_all()

    def _load_all(self):
        builders = {
            "mobilenet_pre":      _build_mobilenet,
            "efficientnet_pre":   _build_efficientnet,
        }
        quant_names = {"mobilenet_quant", "efficientnet_quant"}

        for name, path in MODEL_PATHS.items():
            if not path.exists():
                print(f"[WARN] model not found: {path}")
                continue
            try:
                if name in quant_names:
                    # quantized models saved as full objects via torch.save(model, ...)
                    # but notebooks used state_dict — rebuild + quantize + load state
                    base_builder = _build_mobilenet if "mobilenet" in name else _build_efficientnet
                    base = base_builder()
                    base.eval()
                    quantized = torch.quantization.quantize_dynamic(
                        base, {nn.Linear}, dtype=torch.qint8
                    )
                    state = torch.load(path, map_location="cpu", weights_only=False)
                    quantized.load_state_dict(state)
                    quantized.eval()
                    self._models[name] = quantized
                else:
                    model = builders[name]()
                    state = torch.load(path, map_location="cpu", weights_only=True)
                    model.load_state_dict(state)
                    model.eval()
                    self._models[name] = model
                print(f"[OK] loaded {name}")
            except Exception as e:
                print(f"[ERR] failed to load {name}: {e}")

    def models_available(self) -> dict:
        return {k: True for k in self._models}

    def predict(self, img_bytes: bytes, model_name: str, preprocess: bool) -> dict:
        if model_name not in self._models:
            return {"error": f"Model '{model_name}' not loaded. Check server logs."}

        # decode
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        if preprocess:
            img = preprocess_image(img)
        
        tensor = to_tensor(img)

        model = self._models[model_name]
        t0 = time.perf_counter()
        with torch.no_grad():
            logits = model(tensor)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        probs = torch.softmax(logits, dim=1)[0].numpy().tolist()
        pred_idx = int(np.argmax(probs))

        return {
            "prediction": LABELS[pred_idx],
            "confidence": round(probs[pred_idx] * 100, 2),
            "probabilities": {
                "Parasitized": round(probs[0] * 100, 2),
                "Uninfected":  round(probs[1] * 100, 2),
            },
            "model": model_name,
            "preprocessed": preprocess,
            "latency_ms": round(elapsed_ms, 2),
        }


# ── Metrics loader ─────────────────────────────────────────────────────────────

def get_metrics() -> list[dict] | None:
    if not METRICS_PATH.exists():
        return None
    rows = []
    with open(METRICS_PATH, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({
                "model":     row["Model"],
                "accuracy":  float(row["Accuracy"]),
                "f1":        float(row["F1"]),
                "precision": float(row["Precision"]),
                "recall":    float(row["Recall"]),
                "latency":   float(row["Latency(ms)"]),
                "size":      float(row["Size(MB)"]),
            })
    return rows