import { NextResponse } from 'next/server';
import type { SensorPayload } from '@/lib/thermal-api';
import { backendApiUrl } from '@/lib/backend-api';

function isSensorPayload(value: unknown): value is SensorPayload {
  if (!value || typeof value !== 'object') return false;
  const sensor = value as Partial<SensorPayload>;
  return (
    typeof sensor.heart_rate === 'number' &&
    typeof sensor.spo2 === 'number' &&
    typeof sensor.temperature === 'number' &&
    typeof sensor.humidity === 'number' &&
    typeof sensor.activity === 'number'
  );
}

export async function POST(request: Request) {
  try {
    const sensorData: unknown = await request.json();
    if (!isSensorPayload(sensorData)) {
      return NextResponse.json({ error: 'Invalid sensor data' }, { status: 400 });
    }

    const response = await fetch(backendApiUrl('/predict'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sensorData),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
    }

    const prediction: unknown = await response.json();
    return NextResponse.json(prediction);
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}
