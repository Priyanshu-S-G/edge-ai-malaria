# README.md

## Edge AI Malaria Detection

### Overview

This project evaluates lightweight deep learning models for malaria cell classification under edge constraints (low compute, low latency, small size).

### Pipeline

1. **Data Loading**
   Images are loaded from class-based directories and assigned labels automatically.

2. **Preprocessing**

   * Resize to 224×224
   * White balance normalization
   * CLAHE contrast enhancement
   * HSV-based parasite region extraction
   * Morphological cleanup to remove noise

3. **Models**

   * MobileNetV3 (fast, lightweight)
   * EfficientNet-B0 (higher accuracy, heavier)

4. **Training**

   * CrossEntropyLoss
   * Adam optimizer
   * Standard training loop with validation

5. **Evaluation Metrics**

   * Accuracy
   * F1 Score
   * Precision & Recall
   * Confusion Matrix

6. **Latency Measurement**
   Measures milliseconds per image during inference.

7. **Quantization**
   Dynamic INT8 quantization applied to reduce size and improve inference speed.

### Experiments

* Raw vs Preprocessed images
* Quantized vs Non-quantized models
* Model comparison (MobileNet vs EfficientNet)

### Outputs

* Trained model weights (.pth)
* Metrics logs (metrics.csv)
* Evaluation plots and confusion matrices

### Tech Stack

* PyTorch
* Torchvision
* OpenCV
* NumPy
* Scikit-learn

---
