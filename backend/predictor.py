import joblib
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

model = joblib.load(BASE_DIR / "model.pkl")
scaler = joblib.load(BASE_DIR / "scaler.pkl")

features = [
    "heart_rate",
    "spo2",
    "temperature",
    "humidity",
    "activity"
]

def predict(data):
    sample = pd.DataFrame([data])

    scaled = scaler.transform(sample[features])

    prediction = model.predict(scaled)[0]
    score = model.decision_function(scaled)[0]

    status = "NORMAL" if prediction == 1 else "ABNORMAL_PATTERN"

    return {
        "status": status,
        "score": float(score)
    }


if __name__ == "__main__":

    test = {
        "heart_rate": 108,
        "spo2": 95,
        "temperature": 40,
        "humidity": 72,
        "activity": 0
    }

    result = predict(test)

    print(result)