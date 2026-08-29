'use client';

import { useState } from 'react';
import styles from './mobile.module.css';

const phases = [
  {
    name: 'Baseline', tone: 'calm', eyebrow: 'Within your normal range', score: 16,
    message: 'Your body is handling the environment normally.',
    metrics: [['HR', '74', 'bpm'], ['SKIN', '33.2', '°C'], ['HRV', '51', 'ms'], ['HEAT', '8', 'min']],
    recovery: 'No recovery check needed', progress: 92,
  },
  {
    name: 'Heat strain', tone: 'strain', eyebrow: 'Unusual strain detected', score: 68,
    message: 'Your body is working harder than expected for your activity.',
    metrics: [['HR', '105', 'bpm'], ['SKIN', '37.1', '°C'], ['HRV', '23', 'ms'], ['HEAT', '42', 'min']],
    recovery: 'Move to a cool place to begin recovery', progress: 38,
  },
  {
    name: 'Recovering', tone: 'recover', eyebrow: 'Cooling response started', score: 44,
    message: 'Your readings are moving toward your personal baseline.',
    metrics: [['HR', '91', 'bpm'], ['SKIN', '35.6', '°C'], ['HRV', '34', 'ms'], ['REST', '12', 'min']],
    recovery: 'Recovery is on track', progress: 67,
  },
  {
    name: 'Delayed', tone: 'delayed', eyebrow: 'Recovery is slower than usual', score: 76,
    message: 'You are resting, but your body has not recovered as expected.',
    metrics: [['HR', '99', 'bpm'], ['SKIN', '36.2', '°C'], ['HRV', '24', 'ms'], ['REST', '28', 'min']],
    recovery: 'Tell someone nearby and keep cooling', progress: 24,
  },
];

export default function MobileTwin() {
  const [phase, setPhase] = useState(1);
  const [cooling, setCooling] = useState(false);
  const current = phases[cooling ? 2 : phase];

  function nextPhase() {
    setCooling(false);
    setPhase((value) => (value + 1) % phases.length);
  }

  return (
    <main className={styles.stage}>
      <section className={styles.phone} data-tone={current.tone}>
        <header className={styles.header}>
          <div>
            <span className={styles.wordmark}>THERMA</span>
            <span className={styles.live}><i /> Core connected</span>
          </div>
          <button className={styles.avatar} aria-label="Open profile">A</button>
        </header>

        <section className={styles.intro}>
          <div>
            <p>Right now</p>
            <h1>{current.eyebrow}</h1>
          </div>
          <button className={styles.phaseButton} onClick={nextPhase} aria-label="Show the next demonstration state">
            Demo · {current.name}
          </button>
        </section>

        <section className={styles.twinCard} aria-label="Your physiological digital twin">
          <div className={styles.scoreRow}>
            <div>
              <span>Personal deviation</span>
              <strong>{current.score}<small>/100</small></strong>
            </div>
            <p>{current.message}</p>
          </div>

          <div className={styles.bodyStage}>
            <div className={styles.bodyHalo} />
            <img
              className={styles.body}
              src="/human-body-silhouette.svg"
              alt="Front-facing grayscale human digital twin with localized red heat strain at the chest"
            />
            <div className={styles.strainSpot} aria-hidden="true">
              <i /><i /><i /><i />
            </div>
            <span className={styles.bodyLabel}>Localized strain</span>
          </div>

          <div className={styles.metrics}>
            {current.metrics.map(([label, value, unit]) => (
              <div className={styles.metric} key={label}>
                <span>{label}</span>
                <strong>{value}<small>{unit}</small></strong>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.recoveryCard} aria-label="Recovery status">
          <div className={styles.recoveryTop}>
            <div>
              <span>Recovery check</span>
              <strong>{current.recovery}</strong>
            </div>
            <b>{current.progress}%</b>
          </div>
          <div className={styles.progress}><i style={{ width: `${current.progress}%` }} /></div>
          {current.tone === 'strain' && !cooling ? (
            <button className={styles.primary} onClick={() => setCooling(true)}>Start cooling check</button>
          ) : (
            <button className={styles.secondary} onClick={() => { setCooling(false); setPhase(1); }}>Back to live strain</button>
          )}
        </section>

        <nav className={styles.nav} aria-label="Mobile app navigation">
          <button><i>⌁</i><span>Today</span></button>
          <button className={styles.active}><i>◉</i><span>Twin</span></button>
          <button><i>↘</i><span>Recovery</span></button>
          <a href="/" aria-label="Open the 3D wearable"><i>⌇</i><span>Device</span></a>
        </nav>
      </section>
      <p className={styles.desktopNote}>Mobile digital twin · Resize your browser to preview phone layouts</p>
    </main>
  );
}
