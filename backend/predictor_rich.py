import joblib
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

model = joblib.load(BASE_DIR / "model_rich.pkl")
scaler = joblib.load(BASE_DIR / "scaler_rich.pkl")

features = [
    "hr_deviation",
    "spo2_deviation",
    "resp_deviation",
    "ibi_deviation",
    "rms_dibi_deviation",
    "core_temp_deviation",
    "hr_activity_ratio"
]


def predict_rich(data):
    sample = pd.DataFrame([{
        "hr_deviation": data["hr_deviation"],
        "spo2_deviation": data["spo2_deviation"],
        "resp_deviation": data["resp_deviation"],
        "ibi_deviation": data["ibi_deviation"],
        "rms_dibi_deviation": data["rms_dibi_deviation"],
        "core_temp_deviation": data["core_temp_deviation"],
        "hr_activity_ratio": data["hr_activity_ratio"]
    }])

    scaled = scaler.transform(sample[features])

    prediction = model.predict(scaled)[0]
    score = model.decision_function(scaled)[0]

    status = (
        "NORMAL"
        if prediction == 1
        else "ABNORMAL_PATTERN"
    )

    return {
        "status": status,
        "score": float(score)
    }
if __name__ == "__main__":

    test = {
        "hr_deviation": 12.9,
        "spo2_deviation": -4.0,
        "resp_deviation": 0.19,
        "ibi_deviation": -60.45,
        "rms_dibi_deviation": 0.37,
        "core_temp_deviation": 0.79,
        "hr_activity_ratio": 12.902
    }

    print(predict_rich(test))