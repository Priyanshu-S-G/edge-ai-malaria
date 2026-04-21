import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0

def get_efficientnet(num_classes=2):
    model = efficientnet_b0(weights="DEFAULT")
    in_features = model.classifier[1].in_features
    model.classifier[1] = torch.nn.Linear(in_features, num_classes)
    return model