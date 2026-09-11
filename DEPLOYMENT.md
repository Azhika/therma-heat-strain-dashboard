# RESILIO deployment

The browser calls Next.js API routes on the same Vercel origin. Those server-side routes call FastAPI using `BACKEND_API_URL`, so the Render address is not hardcoded into browser code.

## Vercel

- Framework: Next.js
- Plan: Hobby
- Root directory: repository root
- Build command: `npm run build`
- Environment variable: `BACKEND_API_URL=https://<render-service>.onrender.com`

The public routes are `/` and `/mobile`. API proxies are `/api/predict`, `/api/predict-rich`, and `/api/telemetry/latest`.

## Render

The frontend and backend share one GitHub repository. Deploy the root `render.yaml` as a Blueprint; it configures Render to build the service from the `backend` directory on the Free plan. After Render supplies the public URL, add it to Vercel as `BACKEND_API_URL`, then redeploy the frontend. Set the backend `CORS_ORIGINS` value to the final Vercel origin.

For future hardware, an ESP32 can post the five sensor values directly to `https://<render-service>.onrender.com/telemetry`. See `ESP32-TELEMETRY.md` for the payload.

