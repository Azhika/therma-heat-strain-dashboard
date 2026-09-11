export const FEATURE_KEYS = [
  'hr_deviation', 'spo2_deviation', 'resp_deviation', 'ibi_deviation',
  'rms_dibi_deviation', 'core_temp_deviation', 'hr_activity_ratio',
] as const;
export type RichFeatures = Record<(typeof FEATURE_KEYS)[number], number>;
export type RichPrediction = {
  features: RichFeatures;
  ai_result: { status: string; score: number };
};
export type RawPhysiology = {
  heartRate: number | null; spo2: number | null; respiration: number | null;
  activity: number | null; estimatedCoreTemp: number | null;
};
export type ParticipantBaseline = Omit<RawPhysiology, 'activity'>;
// One complete recorded frame can be supplied per second later. No random generator.
export type PhysiologyFrame = {
  id: string; recordedAt: string | null; source: 'integration-test' | 'recorded-replay' | 'esp32-live';
  participantLabel: string; raw: RawPhysiology; baseline: ParticipantBaseline;
  features: RichFeatures;
};
export const TEST_FRAME: PhysiologyFrame = {
  id: 'personalized-integration-test', recordedAt: null, source: 'integration-test',
  participantLabel: 'Participant baseline example (not a loaded recording)',
  baseline: { heartRate: 94, spo2: 99, respiration: 14.3, estimatedCoreTemp: 36.76 },
  // Baseline + supplied deviation; these are illustrative, not sensor readings.
  raw: { heartRate: 106.9, spo2: 95, respiration: 14.49, activity: null, estimatedCoreTemp: 37.55 },
  features: { hr_deviation: 12.9, spo2_deviation: -4.0, resp_deviation: 0.19,
    ibi_deviation: -60.45, rms_dibi_deviation: 0.37, core_temp_deviation: 0.79,
    hr_activity_ratio: 12.902 },
};
export function isRichFeatures(value: unknown): value is RichFeatures {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return FEATURE_KEYS.every(key => typeof record[key] === 'number' && Number.isFinite(record[key]));
}
export function isRichPrediction(value: unknown): value is RichPrediction {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<RichPrediction>;
  return isRichFeatures(response.features) && !!response.ai_result &&
    typeof response.ai_result.status === 'string' &&
    typeof response.ai_result.score === 'number' && Number.isFinite(response.ai_result.score);
}
export async function requestPersonalizedPrediction(features: RichFeatures, signal?: AbortSignal): Promise<RichPrediction> {
  const response = await fetch('/api/predict-rich', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features), cache: 'no-store', signal,
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
      ? body.error : 'Personalized analysis is unavailable. Please try again.';
    throw new Error(message);
  }
  if (!isRichPrediction(body)) throw new Error('The model returned an unexpected response.');
  return body;
}
