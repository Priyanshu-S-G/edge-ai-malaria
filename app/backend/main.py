from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from inference import InferenceEngine, get_metrics

app = FastAPI(title="Malaria Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = InferenceEngine()


@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": engine.models_available()}


@app.get("/metrics")
def metrics():
    data = get_metrics()
    if data is None:
        raise HTTPException(status_code=404, detail="metrics.csv not found")
    return JSONResponse(content=data)


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model: str = "mobilenet_pre",   # mobilenet_pre | efficientnet_pre | mobilenet_quant | efficientnet_quant
    preprocess: bool = True,
):
    allowed = {"mobilenet_pre", "efficientnet_pre", "mobilenet_quant", "efficientnet_quant"}
    if model not in allowed:
        raise HTTPException(status_code=400, detail=f"model must be one of {allowed}")

    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status_code=400, detail="Only JPEG/PNG accepted")

    img_bytes = await file.read()
    result = engine.predict(img_bytes, model_name=model, preprocess=preprocess)
    return JSONResponse(content=result)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
