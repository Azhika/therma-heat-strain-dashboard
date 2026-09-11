import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api';

export async function GET() {
  try {
    const response = await fetch(
      backendApiUrl('/telemetry/latest'),
      { cache: 'no-store', signal: AbortSignal.timeout(4_000) },
    );

    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    const timedOut = error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError');

    return NextResponse.json(
      {
        error: timedOut
          ? 'The telemetry service timed out.'
          : 'Telemetry service unavailable. Check that FastAPI is running on port 8000.',
      },
      { status: timedOut ? 504 : 502 },
    );
  }
}
