import torch


def quantize_model(model):
    model.cpu()
    model.eval()

    quantized = torch.quantization.quantize_dynamic(
        model,
        {torch.nn.Linear},
        dtype=torch.qint8
    )

    return quantized