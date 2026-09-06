import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorPedometer } from '@capgo/capacitor-pedometer';

export function useStepCounter() {
  const native = Capacitor.isNativePlatform();
  const [status, setStatus] = useState(native ? 'idle' : 'web');
  const [steps, setSteps] = useState(0);
  const listenerRef = useRef(null);

  const stop = useCallback(async () => {
    await listenerRef.current?.remove?.();
    listenerRef.current = null;
    if (native) await CapacitorPedometer.stopMeasurementUpdates().catch(() => {});
    setStatus(native ? 'idle' : 'web');
  }, [native]);

  const start = useCallback(async () => {
    if (!native) return;
    setStatus('requesting');
    try {
      const availability = await CapacitorPedometer.isAvailable();
      if (!availability.stepCounting) return setStatus('unavailable');
      let permission = await CapacitorPedometer.checkPermissions();
      if (permission.activityRecognition !== 'granted') permission = await CapacitorPedometer.requestPermissions();
      if (permission.activityRecognition !== 'granted') return setStatus('denied');
      await CapacitorPedometer.startMeasurementUpdates();
      listenerRef.current = await CapacitorPedometer.addListener('measurement', (event) => {
        setSteps(Math.max(0, Number(event.numberOfSteps || 0)));
      });
      setStatus('active');
    } catch {
      setStatus('unavailable');
    }
  }, [native]);

  useEffect(() => () => {
    listenerRef.current?.remove?.();
    if (native) CapacitorPedometer.stopMeasurementUpdates().catch(() => {});
  }, [native]);

  return { steps, status, start, stop };
}
