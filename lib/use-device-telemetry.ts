'use client';

import { useEffect, useState } from 'react';
import { requestLatestTelemetry, type TelemetrySnapshot } from './device-telemetry';

export type DeviceTelemetryState = {
  phase: 'idle' | 'connecting' | 'live' | 'stale' | 'offline';
  snapshot: TelemetrySnapshot | null;
  error: string | null;
};

export function useDeviceTelemetry(enabled: boolean) {
  const [state, setState] = useState<DeviceTelemetryState>({
    phase: 'idle', snapshot: null, error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ phase: 'idle', snapshot: null, error: null });
      return;
    }

    let active = true;
    let controller: AbortController | null = null;
    setState(previous => ({ ...previous, phase: 'connecting', error: null }));

    async function poll() {
      controller?.abort();
      controller = new AbortController();
      try {
        const snapshot = await requestLatestTelemetry(controller.signal);
        if (!active) return;
        setState({
          phase: snapshot.connected ? 'live' : snapshot.telemetry ? 'stale' : 'connecting',
          snapshot,
          error: null,
        });
      } catch (error) {
        if (!active || (error instanceof Error && error.name === 'AbortError')) return;
        setState(previous => ({
          phase: 'offline', snapshot: previous.snapshot,
          error: error instanceof Error ? error.message : 'Unable to read ESP32 telemetry.',
        }));
      }
    }

    void poll();
    const timer = window.setInterval(() => void poll(), 2_000);
    return () => {
      active = false;
      window.clearInterval(timer);
      controller?.abort();
    };
  }, [enabled]);

  return state;
}
