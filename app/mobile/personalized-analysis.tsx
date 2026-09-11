'use client';

import { useEffect, useRef, useState } from 'react';
import { TEST_FRAME, type RichFeatures } from '@/lib/personalized-api';
import type { DeviceTelemetry } from '@/lib/device-telemetry';
import { useDeviceTelemetry } from '@/lib/use-device-telemetry';
import { usePersonalizedAnalysis } from '@/lib/use-personalized-analysis';
import { requestHeatPrediction, type PredictionResponse, type SensorPayload } from '@/lib/thermal-api';
import styles from './personalized.module.css';

export type DataSource = 'demo' | 'device';

type Props = {
  source: DataSource;
  onSourceChange: (source: DataSource) => void;
};

type DeviceModelState = {
  phase: 'idle' | 'loading' | 'success' | 'error';
  result: PredictionResponse | null;
  error: string | null;
  frameKey: string | null;
};

type ReadingCard = {
  label: string;
  value: number | null;
  unit: string;
  source?: string;
  baseline?: number | null;
  delta?: number;
};

const display = (value: number | null, digits = 1) =>
  value === null ? '—' : Number.isInteger(value) ? String(value) : value.toFixed(digits);
const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`;

function hardwarePayload(telemetry: DeviceTelemetry | null): SensorPayload | null {
  if (!telemetry) return null;
  const frame = telemetry as unknown as Record<string, unknown>;
  const keys = ['heart_rate', 'spo2', 'ambient_temperature', 'humidity', 'activity'] as const;
  if (!keys.every(key => typeof frame[key] === 'number' && Number.isFinite(frame[key]))) return null;
  return {
    heart_rate: frame.heart_rate as number,
    spo2: frame.spo2 as number,
    temperature: frame.ambient_temperature as number,
    humidity: frame.humidity as number,
    activity: frame.activity as number,
  };
}

export default function PersonalizedAnalysis({ source, onSourceChange }: Props) {
  const personalized = usePersonalizedAnalysis();
  const device = useDeviceTelemetry(source === 'device');
  const telemetry = device.snapshot?.telemetry ?? null;
  const devicePayload = hardwarePayload(telemetry);
  const deviceFrameKey = telemetry
    ? `${telemetry.device_id}:${telemetry.sequence ?? device.snapshot?.received_at ?? 'latest'}` : null;
  const requestRef = useRef<AbortController | null>(null);
  const [deviceModel, setDeviceModel] = useState<DeviceModelState>({ phase: 'idle', result: null, error: null, frameKey: null });

  useEffect(() => () => requestRef.current?.abort(), []);

  function changeSource(nextSource: DataSource) {
    if (nextSource === source) return;
    requestRef.current?.abort();
    personalized.reset();
    setDeviceModel({ phase: 'idle', result: null, error: null, frameKey: null });
    onSourceChange(nextSource);
  }

  async function analyzeDevice() {
    if (!devicePayload) return;
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setDeviceModel({ phase: 'loading', result: null, error: null, frameKey: deviceFrameKey });
    try {
      const result = await requestHeatPrediction(devicePayload, request.signal);
      setDeviceModel({ phase: 'success', result, error: null, frameKey: deviceFrameKey });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setDeviceModel({ phase: 'error', result: null, error: 'Hardware analysis unavailable. Check that FastAPI is running.', frameKey: deviceFrameKey });
    }
  }

  const demoResult = personalized.state.result;
  const deviceResultIsCurrent = deviceModel.frameKey !== null && deviceModel.frameKey === deviceFrameKey;
  const modelResult = source === 'demo' ? demoResult : deviceResultIsCurrent ? deviceModel.result : null;
  const modelPhase = source === 'demo' ? personalized.state.phase : deviceResultIsCurrent ? deviceModel.phase : 'idle';
  const modelError = source === 'demo' ? personalized.state.error : deviceResultIsCurrent ? deviceModel.error : null;
  const status = modelResult?.ai_result.status;
  const tone = status === 'NORMAL' ? 'normal' : status === 'ABNORMAL_PATTERN' ? 'abnormal' : 'neutral';
  const message = status === 'NORMAL' ? 'Within the learned hardware pattern'
    : status === 'ABNORMAL_PATTERN' ? 'Unusual physiological strain pattern detected'
    : modelResult ? 'Model status requires interpretation' : 'Ready to look closer.';
  const features: RichFeatures = demoResult?.features ?? TEST_FRAME.features;

  const demoCards: ReadingCard[] = [
    { label: 'Heart rate', value: TEST_FRAME.raw.heartRate, unit: 'bpm', baseline: TEST_FRAME.baseline.heartRate, delta: TEST_FRAME.features.hr_deviation },
    { label: 'Blood oxygen', value: TEST_FRAME.raw.spo2, unit: '%', baseline: TEST_FRAME.baseline.spo2, delta: TEST_FRAME.features.spo2_deviation },
    { label: 'Respiration', value: TEST_FRAME.raw.respiration, unit: 'dataset units', baseline: TEST_FRAME.baseline.respiration, delta: TEST_FRAME.features.resp_deviation },
    { label: 'Estimated core temp.', value: TEST_FRAME.raw.estimatedCoreTemp, unit: '°C', baseline: TEST_FRAME.baseline.estimatedCoreTemp, delta: TEST_FRAME.features.core_temp_deviation },
  ];
  const deviceCards: ReadingCard[] = [
    { label: 'Heart rate', value: telemetry?.heart_rate ?? null, unit: 'bpm', source: 'MAX30102' },
    { label: 'Blood oxygen', value: telemetry?.spo2 ?? null, unit: '%', source: 'MAX30102' },
    { label: 'Ambient temp.', value: telemetry?.ambient_temperature ?? null, unit: '°C', source: 'BME280' },
    { label: 'Humidity', value: telemetry?.humidity ?? null, unit: '%', source: 'BME280' },
    { label: 'Motion activity', value: telemetry?.activity ?? null, unit: 'index', source: 'MPU6050' },
  ];
  const deviations = [
    ['HR deviation', features.hr_deviation, 'bpm'],
    ['SpO2 deviation', features.spo2_deviation, 'percentage points'],
    ['Respiration deviation', features.resp_deviation, 'dataset units'],
    ['IBI deviation', features.ibi_deviation, 'dataset units'],
    ['RMS dIBI deviation', features.rms_dibi_deviation, 'dataset units'],
    ['Core temperature deviation', features.core_temp_deviation, '°C'],
    ['HR/activity ratio', features.hr_activity_ratio, 'model feature'],
  ] as const;
  const connectionLabel = device.phase === 'live' ? 'ESP32 streaming'
    : device.phase === 'stale' ? 'Last frame is stale'
    : device.phase === 'offline' ? 'Telemetry service offline' : 'Waiting for ESP32';
  const canAnalyzeDevice = device.phase === 'live' && devicePayload !== null;

  return <section className={styles.panel} aria-labelledby="personalized-heading" data-state={tone} aria-busy={modelPhase === 'loading'}>
    <div className={styles.heading}>
      <span>{source === 'demo' ? 'PERSONAL BASELINE / ANALYSIS' : 'PHYSICAL SENSORS / ANALYSIS'}</span>
      <small>{source === 'demo' ? 'Fixed example' : connectionLabel}</small>
    </div>
    <div className={styles.sourceSwitch} role="group" aria-label="Data source">
      <button aria-pressed={source === 'demo'} onClick={() => changeSource('demo')}>Demo data</button>
      <button aria-pressed={source === 'device'} onClick={() => changeSource('device')}>ESP32 device</button>
    </div>
    <h2 id="personalized-heading">Your signals, in context.</h2>
    <p>{source === 'demo' ? <>A reading tells you where you are.<br />Your baseline tells you what has changed.</>
      : <>Five usable signals.<br />Three sensor modules, one live frame.</>}</p>

    {source === 'device' && <div className={styles.connection} data-connection={device.phase} aria-live="polite">
      <i />
      <div><strong>{connectionLabel}</strong><small>{telemetry
        ? `${telemetry.device_id}${telemetry.sequence !== null ? ` · frame ${telemetry.sequence}` : ''}`
        : device.error ?? 'Send the first telemetry frame to begin.'}</small></div>
      {device.snapshot?.age_seconds !== null && device.snapshot?.age_seconds !== undefined &&
        <span>{device.snapshot.age_seconds < 1 ? 'now' : `${Math.round(device.snapshot.age_seconds)}s ago`}</span>}
    </div>}

    <div className={styles.readings}>
      {(source === 'demo' ? demoCards : deviceCards).map(card => <article key={card.label}>
        <h3>{card.label}</h3>
        <strong>{display(card.value)} <small>{card.unit}</small></strong>
        <div>{source === 'demo'
          ? <><span>Baseline {display(card.baseline ?? null)}</span><b>{card.delta === undefined ? '—' : `${signed(card.delta)}${card.unit === '%' ? ' pp' : card.unit === '°C' ? ' °C' : card.unit === 'bpm' ? ' bpm' : ''}`}</b></>
          : <><span>{card.value === null ? 'Awaiting sensor value' : 'Live device reading'}</span><b>{card.source}</b></>}
        </div>
      </article>)}
    </div>

    <p className={styles.provenance}>{source === 'demo'
      ? 'Participant baseline example. Values reconstructed from the supplied baseline and deviations, not live measurements.'
      : telemetry ? 'Five-input frame from MAX30102, BME280 and MPU6050. Sensor accuracy has not been validated.'
        : 'No device values are shown until an ESP32 frame is received.'}</p>

    <div className={styles.result} aria-live="polite">
      <span>{source === 'demo' ? 'PERSONALIZED MODEL' : 'FIVE-SIGNAL HARDWARE MODEL'}</span>
      <h3>{modelPhase === 'loading' ? 'Reading the pattern…' : modelPhase === 'error' ? 'Analysis unavailable' : message}</h3>
      <p>{modelPhase === 'error' ? modelError : modelResult
        ? 'Model output for this frame. An anomaly is not a diagnosis.'
        : source === 'device' && !devicePayload
          ? 'Waiting for heart rate, SpO₂, motion activity, ambient temperature and humidity.'
          : source === 'device' ? 'The five measured hardware values are ready for the existing model.'
            : 'Analyze this example against the learned physiological pattern.'}</p>
      <div className={styles.actions}>
        <button disabled={modelPhase === 'loading' || (source === 'device' && !canAnalyzeDevice)}
          onClick={() => source === 'demo' ? void personalized.analyzeFrame(TEST_FRAME) : void analyzeDevice()}>
          {modelPhase === 'loading' ? 'Analyzing…' : modelResult ? 'Analyze again ↗' : source === 'demo' ? 'Analyze example ↗' : 'Analyze live frame ↗'}
        </button>
        <small>{status ?? (source === 'demo' ? 'Seven derived research features' : 'Five physical sensor inputs')}</small>
      </div>
      {modelResult && <div className={styles.score}><span>Model anomaly score</span><strong>{String(modelResult.ai_result.score)}</strong><small>Not a probability or confidence percentage.</small></div>}
    </div>

    <details className={styles.details}>
      <summary>{source === 'demo' ? 'Signal & model details' : 'Hardware input details'} <span>+</span></summary>
      {source === 'demo'
        ? <dl>{deviations.map(([label, value, unit]) => <div key={label}><dt>{label}</dt><dd>{label === 'HR/activity ratio' ? value : signed(value)} <small>{unit}</small></dd></div>)}</dl>
        : <dl><div><dt>MAX30102</dt><dd>Heart rate + SpO₂</dd></div><div><dt>BME280</dt><dd>Ambient temperature + humidity</dd></div><div><dt>MPU6050</dt><dd>Motion activity</dd></div></dl>}
      <p>{source === 'demo' ? 'Seven supplied integration-test features.' : 'No respiration, core-temperature estimate, IBI metrics or personalized deviations are required for this hardware model.'}</p>
    </details>
  </section>;
}
