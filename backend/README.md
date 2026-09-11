# RESILIO FastAPI backend

Runtime API for the RESILIO Smart India Hackathon proof of concept. The packaged scikit-learn models run directly in FastAPI; no hosted AI API or API key is required.

## Render configuration

- Plan: Free
- Build: `pip install --upgrade pip && pip install -r requirements.txt`
- Start: `uvicorn api:app --host 0.0.0.0 --port $PORT`
- Health check: `/`
- Python: 3.12.10

Set `CORS_ORIGINS` to the final Vercel origin. Multiple origins use commas. Localhost origins are enabled by default for local development.

Runtime files include `api.py`, `predictor.py`, `predictor_rich.py`, `model.pkl`, `scaler.pkl`, `model_rich.pkl`, and `scaler_rich.pkl`.

This service performs physiological anomaly detection for a research prototype. It is not a medical diagnostic system.
