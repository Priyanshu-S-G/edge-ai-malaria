import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small


def get_mobilenet(num_classes=2):
    model = mobilenet_v3_small(pretrained=True)

    in_features = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(in_features, num_classes)

    return model