'use client';

import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import styles from './mobile.module.css';

type PhaseKey = 'baseline' | 'exposure' | 'strain' | 'recovery' | 'delayed';
type ViewKey = 'overview' | 'recovery' | 'hardware';

const PHASES: Record<PhaseKey, {
  label: string; status: string; score: number; hr: number; hrv: number; skin: number;
  ambient: number; humidity: number; activity: string; exposure: number; recovery: number;
  message: string; trend: number[];
}> = {
  baseline: { label: 'Baseline', status: 'Within your normal range', score: 14, hr: 74, hrv: 52, skin: 33.1, ambient: 29.2, humidity: 54, activity: 'Resting', exposure: 4, recovery: 96, message: 'Your readings match your personal pattern.', trend: [72,73,72,74,73,74,74,73,74,74] },
  exposure: { label: 'Heat exposure', status: 'Heat load is building', score: 41, hr: 88, hrv: 39, skin: 35.4, ambient: 39.4, humidity: 71, activity: 'Walking', exposure: 24, recovery: 72, message: 'Your body is compensating for the hotter environment.', trend: [76,79,80,82,81,84,86,85,87,88] },
  strain: { label: 'Heat strain', status: 'Unusual strain detected', score: 68, hr: 105, hrv: 23, skin: 37.1, ambient: 39.4, humidity: 71, activity: 'Low activity', exposure: 42, recovery: 38, message: 'Your physiology is elevated beyond what this activity normally causes.', trend: [89,94,92,98,96,102,99,104,102,105] },
  recovery: { label: 'Recovering', status: 'Cooling response started', score: 44, hr: 91, hrv: 34, skin: 35.6, ambient: 27.0, humidity: 54, activity: 'Resting', exposure: 48, recovery: 67, message: 'Your readings are moving back toward your personal baseline.', trend: [105,102,101,99,97,96,94,93,92,91] },
  delayed: { label: 'Delayed recovery', status: 'Recovery is slower than usual', score: 76, hr: 99, hrv: 24, skin: 36.2, ambient: 27.0, humidity: 54, activity: 'Resting', exposure: 61, recovery: 24, message: 'Rest has started, but your body is not recovering at its usual rate.', trend: [105,103,102,102,101,101,100,100,99,99] },
};

const PHASE_ORDER = Object.keys(PHASES) as PhaseKey[];

function Sparkline({ values, danger = false }: { values: number[]; danger?: boolean }) {
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 112;
    const y = 34 - ((value - min) / Math.max(max - min, 1)) * 27;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg className={styles.spark} viewBox="0 0 112 40" role="img" aria-label="Recent reading trend">
      <path d="M0 34H112" />
      <polyline className={danger ? styles.sparkDanger : ''} points={points} />
      <circle cx="112" cy={points.split(' ').at(-1)?.split(',')[1]} r="2.8" />
    </svg>
  );
}

function RecoveryChart({ delayed }: { delayed: boolean }) {
  const expected = '18,28 84,61 150,78 216,88 282,95 348,100 414,104 480,107';
  const actual = delayed
    ? '18,28 84,41 150,49 216,55 282,61 348,66 414,70 480,74'
    : '18,28 84,50 150,67 216,80 282,89 348,97 414,102 480,106';
  return (
    <svg className={styles.recoveryChart} viewBox="0 0 500 128" preserveAspectRatio="none" role="img" aria-label="Expected and actual recovery comparison">
      {[28,55,82,109].map(y => <line key={y} x1="18" y1={y} x2="480" y2={y} />)}
      <polyline className={styles.expected} points={expected} />
      <polyline className={styles.actual} points={actual} />
      <circle className={styles.chartDot} cx="480" cy={delayed ? '74' : '106'} r="4" />
    </svg>
  );
}

function VitalCard({ label, value, unit, detail, values, danger }: { label: string; value: string | number; unit: string; detail: string; values: number[]; danger?: boolean }) {
  return (
    <article className={styles.vitalCard}>
      <div className={styles.vitalCopy}>
        <span>{label}</span>
        <strong>{value}<small>{unit}</small></strong>
        <p>{detail}</p>
      </div>
      <Sparkline values={values} danger={danger} />
    </article>
  );
}

export default function ThermalDashboard() {
  const [phase, setPhase] = useState<PhaseKey>('strain');
  const [view, setView] = useState<ViewKey>('overview');
  const [monitoring, setMonitoring] = useState(false);
  const [recoveryMinutes, setRecoveryMinutes] = useState(0);
  const [lastSync, setLastSync] = useState(2);
  const data = PHASES[phase];

  useEffect(() => {
    const syncTimer = window.setInterval(() => setLastSync(value => value >= 8 ? 1 : value + 1), 1800);
    return () => window.clearInterval(syncTimer);
  }, []);

  useEffect(() => {
    if (!monitoring) return;
    const recoveryTimer = window.setInterval(() => {
      setRecoveryMinutes(value => {
        const next = value + 1;
        if (next >= 18) {
          setMonitoring(false);
          setPhase('baseline');
        }
        return next;
      });
    }, 1400);
    return () => window.clearInterval(recoveryTimer);
  }, [monitoring]);

  const liveRecovery = useMemo(() => monitoring ? Math.min(94, 44 + recoveryMinutes * 3) : data.recovery, [data.recovery, monitoring, recoveryMinutes]);
  const titles: Record<ViewKey, [string, string]> = {
    overview: ['Physiological overview', 'Your current response compared with your personal baseline'],
    recovery: ['Recovery monitor', 'Check whether rest and cooling are working as expected'],
    hardware: ['Wearable core', 'Inspect the sensing module and live device diagnostics'],
  };

  function startRecovery() {
    setPhase('recovery');
    setView('recovery');
    setRecoveryMinutes(0);
    setMonitoring(true);
  }

  return (
    <main className={styles.dashboard} data-phase={phase}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span>TH</span><strong>THERMA</strong></div>
        <nav aria-label="Dashboard sections">
          <button className={view === 'overview' ? styles.navActive : ''} onClick={() => setView('overview')}><i>01</i><span>Overview</span></button>
          <button className={view === 'recovery' ? styles.navActive : ''} onClick={() => setView('recovery')}><i>02</i><span>Recovery</span></button>
          <button className={view === 'hardware' ? styles.navActive : ''} onClick={() => setView('hardware')}><i>03</i><span>Hardware</span></button>
        </nav>
        <div className={styles.deviceMini}>
          <div className={styles.deviceSignal}><i /><i /><i /></div>
          <span>THERMA Core</span>
          <strong>Connected</strong>
          <small>Last sync {lastSync}s ago</small>
        </div>
        <a className={styles.backLink} href="/">Open 3D prototype <span>↗</span></a>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div><span>Digital twin / Live</span><h1>{titles[view][0]}</h1><p>{titles[view][1]}</p></div>
          <div className={styles.topActions}>
            <span className={styles.connected}><i /> Live data</span>
            <button className={styles.avatar} aria-label="Open user profile">AA</button>
          </div>
        </header>

        <div className={styles.phaseBar} aria-label="Demonstration state">
          <span>Simulate state</span>
          <div>{PHASE_ORDER.map(key => <button key={key} className={phase === key ? styles.phaseActive : ''} onClick={() => { setPhase(key); setMonitoring(false); }}>{PHASES[key].label}</button>)}</div>
        </div>

        {view === 'overview' && (
          <div className={styles.overviewGrid}>
            <section className={styles.twinPanel}>
              <div className={styles.panelHeading}><div><span>Body response</span><h2>{data.status}</h2></div><button onClick={() => setView('recovery')}>View recovery <b>→</b></button></div>
              <div className={styles.twinContent}>
                <div className={styles.scoreBlock}>
                  <div className={styles.scoreRing} style={{ '--angle': `${data.score * 3.6}deg` } as CSSProperties}><div><strong>{data.score}</strong><small>deviation</small></div></div>
                  <p>{data.message}</p>
                  {(phase === 'strain' || phase === 'delayed') && <button className={styles.coolButton} onClick={startRecovery}>Start cooling check</button>}
                </div>
                <div className={styles.bodyStage}>
                  <div className={styles.bodyAura} />
                  <img src="/human-body-silhouette.svg" alt="Grayscale human body showing a localized red heat-strain region on the upper torso" />
                  <div className={styles.strainRegion} aria-hidden="true"><i /><i /><i /><i /></div>
                  <span className={styles.bodyCallout}>Physiological strain</span>
                </div>
                <div className={styles.bodyMetrics}>
                  <div><span>Heart rate</span><strong>{data.hr}<small>bpm</small></strong><em>{data.hr - 74 > 0 ? `+${data.hr - 74}` : '0'} vs normal</em></div>
                  <div><span>Skin temperature</span><strong>{data.skin.toFixed(1)}<small>°C</small></strong><em>{data.skin > 35 ? 'Elevated' : 'Normal'}</em></div>
                  <div><span>HRV</span><strong>{data.hrv}<small>ms</small></strong><em>{data.hrv < 30 ? 'Below baseline' : 'In range'}</em></div>
                  <div><span>Heat exposure</span><strong>{data.exposure}<small>min</small></strong><em>{data.ambient.toFixed(1)}° ambient</em></div>
                </div>
              </div>
            </section>

            <aside className={styles.vitalsColumn}>
              <div className={styles.panelHeading}><div><span>Live physiology</span><h2>Physical parameters</h2></div><span className={styles.sampleRate}>1 sample/s</span></div>
              <VitalCard label="Heart rate" value={data.hr} unit="bpm" detail="Activity adjusted" values={data.trend} danger={data.hr > 98} />
              <VitalCard label="HRV" value={data.hrv} unit="ms" detail="Personal RMSSD" values={[52,48,44,40,38,34,31,29,26,data.hrv]} danger={data.hrv < 28} />
              <div className={styles.environmentRow}>
                <div><span>Ambient</span><strong>{data.ambient.toFixed(1)}°</strong></div>
                <div><span>Humidity</span><strong>{data.humidity}%</strong></div>
                <div><span>Activity</span><strong>{data.activity}</strong></div>
              </div>
              <section className={styles.moduleCard}>
                <div className={styles.moduleTop}><div className={styles.moduleGlyph}><i /></div><div><span>THERMA Core</span><strong>Edge model active</strong></div><b>78%</b></div>
                <div className={styles.moduleStats}><span>Signal <b>Excellent</b></span><span>Skin contact <b>Stable</b></span></div>
                <button onClick={() => setView('hardware')}>Inspect hardware <span>→</span></button>
              </section>
            </aside>

            <section className={styles.recoveryStrip}>
              <div className={styles.recoverySummary}><span>Recovery status</span><strong>{phase === 'delayed' ? 'Slower than your usual response' : phase === 'recovery' ? 'Moving toward baseline' : 'Ready when cooling begins'}</strong><p>Expected versus actual recovery after rest and cooling</p></div>
              <div className={styles.chartWrap}><div className={styles.chartLegend}><span><i /> Expected</span><span><i /> Actual</span></div><RecoveryChart delayed={phase === 'delayed'} /></div>
              <div className={styles.recoveryScore}><strong>{liveRecovery}%</strong><span>recovered</span><div><i style={{ width: `${liveRecovery}%` }} /></div><button onClick={() => setView('recovery')}>Open monitor</button></div>
            </section>
          </div>
        )}

        {view === 'recovery' && (
          <div className={styles.focusGrid}>
            <section className={styles.focusPanel}>
              <div className={styles.panelHeading}><div><span>Personal recovery curve</span><h2>{monitoring ? `Cooling check · ${recoveryMinutes} min` : phase === 'delayed' ? 'Recovery needs attention' : 'Recovery comparison'}</h2></div><span className={monitoring ? styles.monitoring : styles.ready}>{monitoring ? 'Monitoring live' : 'Ready'}</span></div>
              <div className={styles.largeChart}><div className={styles.chartLabels}><span>Strain</span><span>Baseline</span></div><RecoveryChart delayed={phase === 'delayed' && !monitoring} /></div>
              <div className={styles.recoveryCards}>
                <article><span>Expected now</span><strong>86<small>bpm</small></strong><p>Based on your previous cooling sessions</p></article>
                <article><span>Actual now</span><strong>{monitoring ? Math.max(84, 103 - recoveryMinutes) : data.hr}<small>bpm</small></strong><p>{phase === 'delayed' && !monitoring ? '13 bpm above expected' : 'Closing the expected gap'}</p></article>
                <article><span>Recovery score</span><strong>{liveRecovery}<small>%</small></strong><p>{liveRecovery < 40 ? 'Slower than usual' : 'Improving normally'}</p></article>
              </div>
            </section>
            <aside className={styles.guidancePanel}>
              <span>What to do now</span><h2>{phase === 'delayed' ? 'Keep cooling and tell someone nearby.' : 'Give your body time to cool.'}</h2>
              <ol><li><b>01</b><div><strong>Move to shade</strong><p>Reduce direct heat exposure.</p></div></li><li><b>02</b><div><strong>Drink water</strong><p>Take small, regular sips.</p></div></li><li><b>03</b><div><strong>Rest and monitor</strong><p>THERMA will verify your recovery.</p></div></li></ol>
              <button className={styles.startButton} onClick={monitoring ? () => setMonitoring(false) : startRecovery}>{monitoring ? 'Pause recovery check' : 'Start recovery check'}</button>
              <small>Not a diagnosis or emergency medical device.</small>
            </aside>
          </div>
        )}

        {view === 'hardware' && (
          <div className={styles.hardwareGrid}>
            <section className={styles.hardwareViewport}>
              <div className={styles.viewportHead}><div><span>Interactive model</span><h2>Screenless sensing core</h2></div><a href="/" target="_blank" rel="noreferrer">Open full view ↗</a></div>
              <iframe src="/therma-core.html?embed=1" title="Interactive 3D model of the THERMA wearable sensing core" allow="fullscreen" />
              <p>Drag to rotate · Scroll to zoom · The screenless module sits inside a breathable textile band.</p>
            </section>
            <aside className={styles.diagnosticsPanel}>
              <div className={styles.panelHeading}><div><span>Device diagnostics</span><h2>All systems normal</h2></div><span className={styles.connected}><i /> Connected</span></div>
              <div className={styles.deviceReadings}><div><span>Battery</span><strong>78%</strong><em>~31 h remaining</em></div><div><span>Signal quality</span><strong>96%</strong><em>PPG contact stable</em></div><div><span>Core temperature</span><strong>31.8°C</strong><em>Operating normally</em></div><div><span>Edge inference</span><strong>42 ms</strong><em>ESP32-S3 local</em></div></div>
              <div className={styles.sensorList}><span>Active sensors</span><p><b>MAX30102</b> Heart rate + HRV</p><p><b>TMP117</b> Skin temperature</p><p><b>BME280</b> Ambient + humidity</p><p><b>BMI270</b> Movement + activity</p></div>
              <button onClick={() => setView('overview')}>Return to live dashboard</button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
