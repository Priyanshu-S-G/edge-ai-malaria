import time
import torch


def measure_latency(model, loader, device):
    model.eval()
    model.to(device)

    start = time.time()

    with torch.no_grad():
        for images, _ in loader:
            images = images.to(device)
            _ = model(images)

    end = time.time()

    total_images = len(loader.dataset)
    latency = (end - start) / total_images * 1000  # ms/image

    return latency