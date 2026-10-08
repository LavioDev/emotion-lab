# Emotion Chat API and web app

The FastAPI service loads the fine-tuned DistilBERT checkpoint once at startup. The same app serves the Flowbite-based HTML chat interface and the prediction endpoint.

## Run on Windows PowerShell

From the repository root, install only the inference and API dependencies:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements-api.txt
```

Start the app from the repository root:

```powershell
python -m uvicorn app.backend.main:app --host 127.0.0.1 --port 8000
```

Open <http://127.0.0.1:8000>. Interactive API documentation is at <http://127.0.0.1:8000/docs>.

By default, the app loads `models/distilbert-emotion-mixed-v1`. To use another saved model directory, set `EMOTION_MODEL_DIR` before starting Uvicorn:

```powershell
$env:EMOTION_MODEL_DIR = "C:\path\to\your\saved-model"
python -m uvicorn app.backend.main:app --host 127.0.0.1 --port 8000
```

The endpoint `POST /api/predict` accepts `{"text":"I feel happy today."}` and returns the highest scoring emotion, scores for all six labels, model folder name, and inference time. The scores are softmax outputs and are not calibrated confidence estimates. Inputs are capped at 4,000 characters and tokenized with truncation at 128 tokens.

The frontend is in `app/frontend` and loads Flowbite and Chart.js from their CDNs, so an internet connection is needed in the browser. The model itself is loaded from `models/` and does not require a Hugging Face download.
