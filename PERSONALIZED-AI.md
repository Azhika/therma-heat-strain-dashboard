# Personalized anomaly integration

Implemented incrementally in the existing Next.js dashboard. The old /api/predict proxy, /predict backend, normal/abnormal buttons, routes and existing visual components remain available.

## Exact file changes

Modified:
- C:/Users/azhik/OneDrive/Desktop/memvazhi/therma-site/app/mobile/page.tsx — imports and renders the new panel; no changes to legacy prediction logic.

Created:
- C:/Users/azhik/OneDrive/Desktop/memvazhi/therma-site/app/api/predict-rich/route.ts — server-side POST proxy, finite feature validation, malformed-request handling, 10-second timeout and clear 502/504 errors. Backend JSON and HTTP status pass through unchanged when received as valid JSON.
- C:/Users/azhik/OneDrive/Desktop/memvazhi/therma-site/lib/personalized-api.ts — typed frames, seven derived features, response validation, fixed integration fixture and browser request helper.
- C:/Users/azhik/OneDrive/Desktop/memvazhi/therma-site/lib/use-personalized-analysis.ts — atomic frame/result state, cancellation, stale-response protection and unmount cleanup.
- C:/Users/azhik/OneDrive/Desktop/memvazhi/therma-site/app/mobile/personalized-analysis.tsx — raw readings, participant baseline example, seven feature values, model status and full score.
- C:/Users/azhik/OneDrive/Desktop/memvazhi/therma-site/app/mobile/personalized.module.css — scoped styling matching the existing green/neutral dashboard, orange anomaly state and responsive layout.
- C:/Users/azhik/OneDrive/Desktop/memvazhi/therma-site/PERSONALIZED-AI.md — this guide.

The FastAPI backend now also accepts optional ESP32 telemetry through `/telemetry`; see `ESP32-TELEMETRY.md`. The legacy prediction endpoint remains available.

## Run locally (PowerShell)

Terminal 1 — activate the Python environment that has your existing model dependencies, then:

```powershell
cd C:\Users\azhik\OneDrive\Desktop\health_compnaion
python -m uvicorn api:app --reload
```

Terminal 2:

```powershell
cd C:\Users\azhik\OneDrive\Desktop\memvazhi\therma-site
npm run dev
```

Open http://localhost:3000/mobile. FastAPI is already running during verification; do not start a duplicate on port 8000. A Next dev server was started for testing at http://127.0.0.1:3000/mobile; if still running, use it instead of starting another instance.

The server defaults to http://127.0.0.1:8000/predict-rich. Optionally set PREDICT_RICH_API_URL in .env.local and restart Next. Do not use a NEXT_PUBLIC variable. The old PREDICT_API_URL setting is independent. On deployment, loopback refers to the Next server, not the visitor's computer; configure an accessible backend before deploying.

## Test

Click TEST PERSONALIZED ANOMALY. It posts the exact seven-feature payload supplied in the request to /api/predict-rich. Expected result observed from the running model:

- Status: ABNORMAL_PATTERN
- Message: Unusual physiological strain pattern detected
- Model anomaly score: -0.000453097904339006

The result is actually returned by FastAPI; it is not hardcoded. A NORMAL response uses green and the message Within learned physiological pattern. Unknown statuses remain neutral. Scores are shown without confidence/probability conversion. Loading and error states clear previous results so stale results are not shown as current.

The participant baseline is an explicitly labeled example, not a loaded EPA recording. Example raw HR, SpO2, respiration and estimated core temperature are baseline + deviation; activity is Not supplied. Respiration, IBI and RMS dIBI units remain dataset units until confirmed from the recorded data schema. SpO2 deviation is labeled percentage points. No random values were added.

## Recorded replay extension

PhysiologyFrame holds an id, recorded timestamp, source, participant label, raw values, participant baseline and derived features. usePersonalizedAnalysis exposes analyzeFrame(frame). A future recorded-data controller can pass the next dataset frame to this function once per second. Raw values, features and the returned result stay associated with the same frame. Do not separately update individual readings and the AI result; use the complete frame. New requests cancel older ones, and stale responses cannot replace the newest state. Pace/await requests if inference is slower than the replay interval.

No replay timer or dataset loader is implemented. The existing visual demo scenarios remain independent and are explicitly identified as separate from the personalized integration fixture.

## Verification

- TypeScript: passed.
- Production next build: passed; includes /, /mobile, /api/predict, /api/predict-rich and /api/telemetry/latest.
- Lint for all new TypeScript/TSX files: passed.
- Focused request tests: passed for forwarding, preservation of response JSON, invalid/malformed input, finite numbers, upstream HTTP errors, unavailable backend, timeout, malformed upstream JSON and client response validation.
- Live Next proxy request: matched the direct FastAPI response.
- Browser: clicked new test button, observed loading then real abnormal result and exact score.
- Browser: clicked old Normal scenario; observed NORMAL and score 0.1764962162896931 in the old panel, with personalized result preserved.
- Full-project lint is not clean due to pre-existing issues: generated dist output is included in lint, and the existing mobile page uses an anchor to / instead of Next Link. These were not changed in this integration.

This integration performs physiological anomaly detection, not medical diagnosis. Existing demo diagnostics elsewhere in the original app were not reworked or connected to physical hardware.
