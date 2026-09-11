'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { requestPersonalizedPrediction, type PhysiologyFrame, type RichPrediction } from './personalized-api';
export type PersonalizedState = {
  frame: PhysiologyFrame | null; result: RichPrediction | null;
  phase: 'idle' | 'loading' | 'success' | 'error'; error: string | null;
};
export function usePersonalizedAnalysis() {
  const [state, setState] = useState<PersonalizedState>({ frame: null, result: null, phase: 'idle', error: null });
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { sequence.current += 1; controller.current?.abort(); }, []);
  const analyzeFrame = useCallback(async (frame: PhysiologyFrame) => {
    const current = ++sequence.current;
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setState({ frame, result: null, phase: 'loading', error: null });
    try {
      const result = await requestPersonalizedPrediction(frame.features, request.signal);
      if (current === sequence.current) setState({ frame, result, phase: 'success', error: null });
    } catch (error) {
      if (current === sequence.current) setState({ frame, result: null, phase: 'error',
        error: error instanceof Error ? error.message : 'Personalized analysis unavailable.' });
    }
  }, []);
  const reset = useCallback(() => {
    sequence.current += 1;
    controller.current?.abort();
    setState({ frame: null, result: null, phase: 'idle', error: null });
  }, []);
  return { state, analyzeFrame, reset };
}
