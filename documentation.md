## Experiment Design

### Objective

To evaluate the trade-offs between accuracy, latency, and model size for malaria detection in edge environments.

### Dataset

Binary classification dataset organized into two folders (infected / uninfected).

### Preprocessing Impact

The preprocessing pipeline enhances parasite visibility by:

* Correcting color imbalance
* Improving contrast using CLAHE
* Isolating relevant regions using HSV masking
* Removing noise via morphological operations

This reduces background interference and improves feature learning.

### Models Compared

#### MobileNetV3

* Designed for mobile/edge devices
* Lower latency
* Smaller size

#### EfficientNet-B0

* Better feature scaling
* Higher accuracy
* Higher computational cost

### Training Procedure

* Standard supervised training
* Validation after each epoch
* Metrics tracked across epochs

### Evaluation Metrics

* Accuracy: Overall correctness
* F1 Score: Balance of precision and recall
* Precision: False positive control
* Recall: False negative control
* Confusion Matrix: Detailed prediction breakdown

### Latency Analysis

Latency is computed as average inference time per image.
Critical for edge deployment.

### Quantization Effects

* Converts model weights to INT8 (linear layers)
* Reduces memory footprint
* Improves CPU inference speed
* Slight drop in accuracy observed

### Results Summary

* Preprocessing significantly improves model performance
* MobileNet achieves best latency
* EfficientNet achieves best accuracy
* Quantization reduces size and latency with minimal accuracy loss

### Conclusion

For real-world edge deployment:

* MobileNet + preprocessing + quantization is the best balance
* EfficientNet is suitable when accuracy is prioritized over speed

The study highlights the importance of preprocessing and model optimization for practical AI deployment in healthcare.