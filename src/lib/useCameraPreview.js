import { useEffect, useRef, useState } from 'react';

/**
 * Live rear-camera preview for the Capture screen.
 *
 * The mockup treats the camera as the *environment*, not a widget, so the
 * viewfinder has to be a real video stream wherever the platform allows one.
 * Where it doesn't — permission denied, no device, insecure origin, headless
 * test browsers — the caller falls back to the ambient world backdrop rather
 * than showing a broken black rectangle.
 *
 * `active` lets the caller stop the stream as soon as the shutter fires so the
 * camera light doesn't stay on during scanning/reveal.
 */
export function useCameraPreview(active = true) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | starting | live | unavailable

  useEffect(() => {
    let cancelled = false;

    const stop = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    if (!active) {
      stop();
      return () => stop();
    }

    const start = async () => {
      const media = typeof navigator !== 'undefined' ? navigator.mediaDevices : null;
      if (!media?.getUserMedia) {
        setStatus('unavailable');
        return;
      }
      setStatus('starting');
      try {
        const stream = await media.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Autoplay can still reject (backgrounded tab); the catch keeps the
          // fallback backdrop rather than throwing into the render tree.
          try { await videoRef.current.play(); } catch { /* keep fallback */ }
        }
        if (!cancelled) setStatus('live');
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    };

    start();
    return () => { cancelled = true; stop(); };
  }, [active]);

  return { videoRef, status };
}
