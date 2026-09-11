import { NextResponse } from 'next/server';
import { isRichFeatures } from '@/lib/personalized-api';
import { backendApiUrl } from '@/lib/backend-api';

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  if (!isRichFeatures(payload)) {
    return NextResponse.json({ error: 'All seven personalized features must be finite numbers.' }, { status: 400 });
  }
  try {
    const response = await fetch(backendApiUrl('/predict-rich'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), cache: 'no-store', signal: AbortSignal.timeout(10_000),
    });
    // Preserve the backend JSON and its HTTP status, including validation errors.
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return NextResponse.json({ error: timedOut
      ? 'Personalized analysis timed out. Please try again.'
      : 'Personalized analysis unavailable. Check that FastAPI is running on port 8000.' },
    { status: timedOut ? 504 : 502 });
  }
}
