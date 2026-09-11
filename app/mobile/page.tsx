'use client';
import { useState } from 'react';
import Link from 'next/link';
import { requestHeatPrediction, type PredictionResponse, type SensorPayload } from '@/lib/thermal-api';
import PersonalizedAnalysis, { type DataSource } from './personalized-analysis';
import styles from './mobile.module.css';
type PhaseKey = 'baseline' | 'exposure' | 'strain' | 'recovery' | 'delayed';


const PHASES: Record<PhaseKey, {
  label: string; status: string; score: number; hr: number; hrv: number; spo2: number; skin: number;
  ambient: number; humidity: number; activity: string; exposure: number; recovery: number;
  message: string; trend: number[];
}> = {
  baseline: { label: 'Baseline', status: 'Within your normal range', score: 14, hr: 74, hrv: 52, spo2: 98, skin: 33.1, ambient: 29.2, humidity: 54, activity: 'Resting', exposure: 4, recovery: 96, message: 'Your readings match your personal pattern.', trend: [72,73,72,74,73,74,74,73,74,74] },
  exposure: { label: 'Heat exposure', status: 'Heat load is building', score: 41, hr: 88, hrv: 39, spo2: 97, skin: 35.4, ambient: 39.4, humidity: 71, activity: 'Walking', exposure: 24, recovery: 72, message: 'Your body is compensating for the hotter environment.', trend: [76,79,80,82,81,84,86,85,87,88] },
  strain: { label: 'Heat strain', status: 'Unusual strain detected', score: 68, hr: 105, hrv: 23, spo2: 95, skin: 37.1, ambient: 39.4, humidity: 71, activity: 'Low activity', exposure: 42, recovery: 38, message: 'Your physiology is elevated beyond what this activity normally causes.', trend: [89,94,92,98,96,102,99,104,102,105] },
  recovery: { label: 'Recovering', status: 'Cooling response started', score: 44, hr: 91, hrv: 34, spo2: 97, skin: 35.6, ambient: 27.0, humidity: 54, activity: 'Resting', exposure: 48, recovery: 67, message: 'Your readings are moving back toward your personal baseline.', trend: [105,102,101,99,97,96,94,93,92,91] },
  delayed: { label: 'Delayed recovery', status: 'Recovery is slower than usual', score: 76, hr: 99, hrv: 24, spo2: 95, skin: 36.2, ambient: 27.0, humidity: 54, activity: 'Resting', exposure: 61, recovery: 24, message: 'Rest has started, but your body is not recovering at its usual rate.', trend: [105,103,102,102,101,101,100,100,99,99] },
};

const PHASE_ORDER = Object.keys(PHASES) as PhaseKey[];
const NORMAL_SCENARIO: SensorPayload = {
  heart_rate: 76,
  spo2: 98,
  temperature: 29,
  humidity: 55,
  activity: 0,
};
const ABNORMAL_SCENARIO: SensorPayload = {
  heart_rate: 108,
  spo2: 95,
  temperature: 40,
  humidity: 72,
  activity: 0,
};


export default function ResilioDashboard() {
 const [phase,setPhase]=useState<PhaseKey>('strain');
 const [source,setSource]=useState<DataSource>('demo');
 const [legacy,setLegacy]=useState<PredictionResponse|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const data=PHASES[phase];
 async function analyze(payload:SensorPayload){
  setLoading(true);setError('');setLegacy(null);
  try { setLegacy(await requestHeatPrediction(payload)); }
  catch { setError('Analysis unavailable. Check that the backend is running.'); }
  finally { setLoading(false); }
 }
 return <main className={styles.dashboard} data-phase={phase}>
  <header className={styles.masthead}>
   <Link href="/mobile" className={styles.brand} aria-label="Resilio overview"><span className={styles.mark}>r.</span>RESILIO</Link>
   <span className={styles.product}>PHYSIOLOGICAL INTELLIGENCE</span>
   <span className={styles.mode} data-live={source==='device'}><i/> {source==='device'?'ESP32 stream':'Demo workspace'}</span>
  </header>
  <div className={styles.workspace}>
   <header className={styles.intro}><div><span className={styles.eyebrow}>PERSONAL PATTERNS / 01</span><h1>A closer look at <br/>your resilience.</h1></div><p>Understand the change.<br/>See the pattern behind the numbers.<small>{source==='device'?'ESP32 telemetry · Live when frames arrive':'Example inputs · Actual model inference'}</small></p></header>
   <div className={styles.mainGrid}>
    <section className={styles.bodyPanel} aria-labelledby="body-heading">
     <div className={styles.panelHead}><div><span className={styles.eyebrow}>BODY RESPONSE</span><h2 id="body-heading">The physiological picture</h2></div><span className={styles.visualTag}>Illustration</span></div>
                <div className={styles.bodyStage}>
                  <div className={styles.bodyAura} />
                  <img src="/human-body-silhouette.svg" alt="Grayscale human body showing a localized red heat-strain region on the upper torso" />
                  <div className={styles.strainRegion} aria-hidden="true"><i /><i /><i /><i /></div>
                  <span className={styles.bodyCallout}>Physiological strain</span>
                </div>

     <div className={styles.bodyCaption}><span className={styles.eyebrow}>VISUAL SCENARIO</span><label htmlFor="visual-scenario" className={styles.srOnly}>Body illustration scenario</label><select id="visual-scenario" value={phase} onChange={e=>setPhase(e.target.value as PhaseKey)}>{PHASE_ORDER.map(key=><option key={key} value={key}>{PHASES[key].label}</option>)}</select><p>{data.message}</p><small>Concept illustration. Independent of the model result.</small></div>
    </section>
    <PersonalizedAnalysis source={source} onSourceChange={setSource} />
   </div>
   <section className={styles.secondary} aria-label="Additional project information">
    <details><summary><span>01</span> About this demonstration <b>+</b></summary><div className={styles.detailContent}><h3>A model, not a diagnosis.</h3><p>The personalized endpoint analyzes seven features relative to a participant baseline. This screen uses the supplied fixed integration example, not live hardware or a loaded recording. Recorded sessions can be connected next.</p><p>No device connection, battery level or signal quality is being measured here.</p></div></details>
    <details><summary><span>02</span> Recovery concept <b>+</b></summary><div className={styles.detailContent}><h3>Returning toward baseline</h3><p>Illustrative recovery curves only. These are not participant measurements or a validated recovery score.</p><svg className={styles.recoveryChart} viewBox="0 0 500 128" role="img" aria-label="Illustrative expected and slower recovery curves"><path d="M18 109H480"/><polyline points="18,28 84,61 150,78 216,88 282,95 348,100 414,104 480,107"/><polyline points="18,28 84,41 150,49 216,55 282,61 348,66 414,70 480,74"/></svg><p>Dashed: example expected curve. Solid: example slower response.</p></div></details>
    <details><summary><span>03</span> Hardware connection & legacy model <b>+</b></summary><div className={styles.detailContent}><h3>Ready for an ESP32 stream.</h3><p>The dashboard polls the local telemetry service and clearly marks live, stale, waiting, and offline states. Sensor accuracy and the 3D assembly still require hardware validation.</p><Link href="/" target="_blank">Explore the 3D prototype ↗</Link><hr/><h3>Legacy model test</h3><p>Separate fixed examples using the original prediction endpoint.</p><div className={styles.legacyButtons}><button disabled={loading} onClick={()=>void analyze(NORMAL_SCENARIO)}>Normal scenario</button><button disabled={loading} onClick={()=>void analyze(ABNORMAL_SCENARIO)}>Abnormal strain scenario</button></div><p aria-live="polite">{loading?'Analyzing…':error|| (legacy?`${legacy.ai_result.status} · Model anomaly score ${legacy.ai_result.score}`:'No legacy result yet.')}</p></div></details>
   </section>
   <footer className={styles.footer}><span>RESILIO <i>/</i> Research prototype</span><span>Physiological anomaly detection. Not medical diagnosis.</span></footer>
  </div>
 </main>;
}
