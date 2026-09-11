export type SensorPayload = {
  heart_rate: number;
  spo2: number;
  temperature: number;
  humidity: number;
  activity: number;
};

export type PredictionResponse = {
  sensor_data: SensorPayload;
  ai_result: {
    status: string;
    score: number;
  };
};

function isPredictionResponse(value: unknown): value is PredictionResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<PredictionResponse>;
  const sensors = response.sensor_data;
  const result = response.ai_result;

  return Boolean(
    sensors &&
      typeof sensors.heart_rate === 'number' &&
      typeof sensors.spo2 === 'number' &&
      typeof sensors.temperature === 'number' &&
      typeof sensors.humidity === 'number' &&
      typeof sensors.activity === 'number' &&
      result &&
      typeof result.status === 'string' &&
      typeof result.score === 'number',
  );
}

// Demo buttons and future ESP32 updates both use this single request path.
export async function requestHeatPrediction(
  sensorData: SensorPayload,
): Promise<PredictionResponse> {
  const response = await fetch('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sensorData),
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('Backend unavailable');

  const result: unknown = await response.json();
  if (!isPredictionResponse(result)) {
    throw new Error('Invalid prediction response');
  }

  return result;
}
