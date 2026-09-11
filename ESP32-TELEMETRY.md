# RESILIO ESP32 telemetry

The dashboard now supports two explicit sources: **Demo data** and **ESP32 device**. Device mode never fills missing values with invented readings. It shows a live state only when FastAPI received a frame during the previous 10 seconds.

## Data path

```text
ESP32 + breakout modules
        |
        | Wi-Fi HTTP POST once per second
        v
FastAPI  POST /telemetry
        |
        | newest frame kept in memory
        v
Next.js  GET /api/telemetry/latest
        |
        v
RESILIO dashboard /mobile
```

The ESP32 must post to the computer's LAN address, not `localhost`. Start FastAPI so another device on the same Wi-Fi network can reach it:

```powershell
cd C:\Users\azhik\OneDrive\Desktop\health_compnaion
python -m uvicorn api:app --host 0.0.0.0 --reload
```

Find the computer's IPv4 address with `ipconfig`, then configure the firmware endpoint as:

```text
http://<computer-ip>:8000/telemetry
```

## Raw frame

Send JSON with `Content-Type: application/json`. Every sensor value is optional so modules can be brought online incrementally.

```json
{
  "device_id": "resilio-esp32-01",
  "sequence": 42,
  "firmware_version": "0.1.0",
  "heart_rate": 82.4,
  "spo2": 97.0,
  "ambient_temperature": 31.8,
  "humidity": 63.0,
  "activity": 0.18
}
```

Expected physical sources are MAX30102 for heart rate and SpO2, BME280 for ambient temperature and humidity, and MPU6050 for motion-derived activity. Their library choice, calibration, sample quality checks, and exact breakout pin order still need hardware verification. GPIO21 remains SDA and GPIO22 remains SCL in the hardware design.

These three modules supply five model inputs. Respiration, estimated core temperature, IBI metrics, and personalized deviations are not required by the hardware model and are not fabricated by the API.

## Live AI analysis

The dashboard displays each available reading immediately. **Analyze live frame** becomes available when a fresh frame contains all five physical inputs: heart rate, SpO2, ambient temperature, humidity, and activity. Device mode sends those values to the existing `/predict` model.

The separate seven-feature personalized model remains available under **Demo data** because its deviations depend on a trained participant baseline and additional derived signals that this hardware does not measure.

## Proof-of-concept limits

- Only the newest frame is stored, in memory. Restarting FastAPI clears it.
- There is no device authentication, encryption, database, or remote deployment yet.
- `connected` means recent data was received; it does not prove sensor contact or signal quality.
- Readings and model output are research demonstrations, not medical diagnosis.
