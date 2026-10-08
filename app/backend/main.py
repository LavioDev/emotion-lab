from __future__ import annotations

import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import torch
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from .labels import LABELS


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_MODEL_DIR = ROOT_DIR / "models" / "distilbert-emotion-mixed-v1"
MODEL_DIR = Path(os.getenv("EMOTION_MODEL_DIR", str(DEFAULT_MODEL_DIR))).expanduser()
WEB_DIR = ROOT_DIR / "app" / "frontend"
STATIC_DIR = WEB_DIR / "static"
MAX_LENGTH = 128


class PredictRequest(BaseModel):
    text: str = Field(max_length=4000, description="English text to classify")


class PredictResponse(BaseModel):
    text: str
    label: str
    score: float
    scores: dict[str, float]
    model_version: str
    inference_ms: float


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not MODEL_DIR.is_dir():
        raise RuntimeError(
            f"Model directory not found: {MODEL_DIR}. Set EMOTION_MODEL_DIR "
            "to the folder containing config.json and model.safetensors."
        )

    app.state.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    app.state.tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR))
    app.state.model = AutoModelForSequenceClassification.from_pretrained(str(MODEL_DIR))
    app.state.model.to(app.state.device)
    app.state.model.eval()

    configured_labels: dict[int, str] = {}
    for key, value in app.state.model.config.id2label.items():
        configured_labels[int(key)] = str(value).lower()
    app.state.labels = [
        configured_labels[index]
        for index in range(app.state.model.config.num_labels)
    ]
    if app.state.labels != list(LABELS):
        raise RuntimeError(
            f"Checkpoint label order {app.state.labels} does not match {list(LABELS)}."
        )
    app.state.model_version = MODEL_DIR.name

    yield

    del app.state.model
    del app.state.tokenizer
    if app.state.device.type == "cuda":
        torch.cuda.empty_cache()


app = FastAPI(
    title="Emotion Chat",
    description="Classify English text into six emotion labels.",
    version="1.0.0",
    lifespan=lifespan,
)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False)
def home() -> FileResponse:
    return FileResponse(WEB_DIR / "index.html")


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "model_loaded": hasattr(app.state, "model"),
        "model_version": getattr(app.state, "model_version", None),
        "device": str(getattr(app.state, "device", "unavailable")),
    }


@app.post("/api/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Please enter a sentence.")
    if not hasattr(app.state, "model"):
        raise HTTPException(status_code=503, detail="The model is not loaded.")

    started_at = time.perf_counter()
    inputs = app.state.tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=MAX_LENGTH,
    )
    inputs = {key: value.to(app.state.device) for key, value in inputs.items()}

    with torch.inference_mode():
        logits = app.state.model(**inputs).logits[0]
        probabilities = torch.softmax(logits, dim=-1).cpu().tolist()

    scores = {
        label: float(probabilities[index])
        for index, label in enumerate(app.state.labels)
    }
    label = max(scores, key=scores.get)

    return PredictResponse(
        text=text,
        label=label,
        score=scores[label],
        scores=scores,
        model_version=app.state.model_version,
        inference_ms=round((time.perf_counter() - started_at) * 1000, 2),
    )
