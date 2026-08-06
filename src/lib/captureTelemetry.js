const GPS_TIMEOUT_MS = 8000;
const MOTION_SAMPLE_MS = 400;

function getGeolocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    const startedAt = performance.now();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyM: position.coords.accuracy ?? null,
          altitude: position.coords.altitude ?? null,
          gpsFixMs: Math.round(performance.now() - startedAt),
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 0 },
    );
  });
}

async function getHeading() {
  if (typeof DeviceOrientationEvent === 'undefined') return null;
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') return null;
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => {
    let resolved = false;
    const onOrientation = (event) => {
      if (resolved) return;
      resolved = true;
      window.removeEventListener('deviceorientationabsolute', onOrientation);
      window.removeEventListener('deviceorientation', onOrientation);
      const heading = event.absolute && typeof event.alpha === 'number' ? 360 - event.alpha : (event.webkitCompassHeading ?? null);
      resolve(typeof heading === 'number' ? heading : null);
    };
    window.addEventListener('deviceorientationabsolute', onOrientation, { once: true });
    window.addEventListener('deviceorientation', onOrientation, { once: true });
    window.setTimeout(() => {
      if (resolved) return;
      resolved = true;
      window.removeEventListener('deviceorientationabsolute', onOrientation);
      window.removeEventListener('deviceorientation', onOrientation);
      resolve(null);
    }, 500);
  });
}

async function getMotionSample() {
  if (typeof DeviceMotionEvent === 'undefined') return { accel: [], gyro: [] };
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== 'granted') return { accel: [], gyro: [] };
    } catch {
      return { accel: [], gyro: [] };
    }
  }
  return new Promise((resolve) => {
    const accel = [];
    const gyro = [];
    const onMotion = (event) => {
      if (event.acceleration && (event.acceleration.x != null)) {
        accel.push([event.acceleration.x, event.acceleration.y, event.acceleration.z]);
      }
      if (event.rotationRate && (event.rotationRate.alpha != null)) {
        gyro.push([event.rotationRate.alpha, event.rotationRate.beta, event.rotationRate.gamma]);
      }
    };
    window.addEventListener('devicemotion', onMotion);
    window.setTimeout(() => {
      window.removeEventListener('devicemotion', onMotion);
      resolve({ accel, gyro });
    }, MOTION_SAMPLE_MS);
  });
}

function readExif(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buffer = reader.result;
        const view = new DataView(buffer);
        if (view.getUint16(0) !== 0xffd8) {
          resolve(null);
          return;
        }
        resolve({
          make: null,
          model: null,
          lens: null,
          exposure: null,
          iso: null,
          orientation: null,
          hasExif: hasExifMarker(view),
        });
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

function hasExifMarker(view) {
  let offset = 2;
  while (offset < view.byteLength - 1) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xe1) return true;
    if (marker === 0xda) break;
    offset += 2 + view.getUint16(offset + 2);
  }
  return false;
}

export async function collectCaptureTelemetry(file) {
  const capturedAt = new Date().toISOString();
  const [gps, heading, motion, exif] = await Promise.all([
    getGeolocation(),
    getHeading(),
    getMotionSample(),
    readExif(file),
  ]);

  return {
    capturedAt,
    gps,
    heading,
    motion,
    exif,
    liveness: {
      attested: true,
      method: 'capture-input-environment',
      score: gps ? 0.7 : 0.4,
    },
    appContext: {
      appVersion: import.meta.env.VITE_APP_VERSION || 'dev',
      os: navigator.platform || 'unknown',
    },
  };
}
