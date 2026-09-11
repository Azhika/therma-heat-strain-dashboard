export type DeviceTelemetry = {
  device_id: string;
  sequence: number | null;
  firmware_version: string | null;
  heart_rate: number | null;
  spo2: number | null;
  ambient_temperature: number | null;
  humidity: number | null;
  activity: number | null;
};

export type TelemetrySnapshot = {
  connected: boolean;
  received_at: string | null;
  age_seconds: number | null;
  telemetry: DeviceTelemetry | null;
};

const nullableFinite = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isFinite(value));

function isDeviceTelemetry(value: unknown): value is DeviceTelemetry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const frame = value as Record<string, unknown>;
  return typeof frame.device_id === 'string' &&
    (frame.sequence === null || (typeof frame.sequence === 'number' && Number.isInteger(frame.sequence))) &&
    (frame.firmware_version === null || typeof frame.firmware_version === 'string') &&
    nullableFinite(frame.heart_rate) && nullableFinite(frame.spo2) &&
    nullableFinite(frame.ambient_temperature) && nullableFinite(frame.humidity) &&
    nullableFinite(frame.activity);
}

function isTelemetrySnapshot(value: unknown): value is TelemetrySnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const snapshot = value as Record<string, unknown>;
  return typeof snapshot.connected === 'boolean' &&
    (snapshot.received_at === null || typeof snapshot.received_at === 'string') &&
    nullableFinite(snapshot.age_seconds) &&
    (snapshot.telemetry === null || isDeviceTelemetry(snapshot.telemetry));
}

export async function requestLatestTelemetry(signal?: AbortSignal): Promise<TelemetrySnapshot> {
  const response = await fetch('/api/telemetry/latest', { cache: 'no-store', signal });
  const body: unknown = await response.json();

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body &&
      typeof body.error === 'string' ? body.error : 'Unable to read ESP32 telemetry.';
    throw new Error(message);
  }

  if (!isTelemetrySnapshot(body)) throw new Error('The telemetry service returned an unexpected response.');
  return body;
}
