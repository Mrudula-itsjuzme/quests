export const AntiCheatVerdict = Object.freeze({ PASS: 'PASS', FLAG: 'FLAG', REJECT: 'REJECT' });
export const GateVerdict = Object.freeze({
  PASS: 'PASS',
  PASS_WITH_REVIEW: 'PASS_WITH_REVIEW',
  REJECT: 'REJECT',
});

const FLAG_THRESHOLD = 2;
const MAX_HUMAN_SPEED_MPS = 120;

function pass(detector, reason = null) {
  return { detector, verdict: AntiCheatVerdict.PASS, reason };
}
function flag(detector, reason) {
  return { detector, verdict: AntiCheatVerdict.FLAG, reason };
}
function reject(detector, reason) {
  return { detector, verdict: AntiCheatVerdict.REJECT, reason };
}

/** Client-attested liveness sanity check — stubbed pending native camera capture. */
export function livenessDetector(bundle) {
  if (!bundle.liveness?.attested) return flag('liveness', 'not_attested');
  return pass('liveness');
}

/** Screenshot/screen-recapture classifier — stub until a vision model is wired in (blueprint §15.1). */
export function screenshotDetector(_bundle) {
  return pass('screenshot');
}

/** Generative-image (Midjourney/SD/GAN) classifier — stub until a vision model is wired in. */
export function aiGeneratedDetector(_bundle) {
  return pass('ai_generated');
}

/** Printed-photo / re-photograph classifier — stub until a vision model is wired in. */
export function printedPhotoDetector(_bundle) {
  return pass('printed_photo');
}

/** Perceptual-hash match against previously seen images (this user + global corpus). */
export async function internetDuplicateDetector(bundle, { repository, userId }) {
  if (!bundle.imageHash) return pass('internet_duplicate');
  const seenGlobally = await repository.hasGlobalSimilarCaptureImageHash?.(userId, bundle.imageHash);
  if (seenGlobally) return reject('internet_duplicate', 'matches_existing_capture');
  return pass('internet_duplicate');
}

/** Cross-checks EXIF/GPS-fix time against server receipt time and capturedAt. */
export function telemetryConsistencyDetector(bundle, { serverReceivedAt }) {
  if (!bundle.capturedAt) return flag('telemetry_consistency', 'missing_captured_at');
  const capturedAt = new Date(bundle.capturedAt).getTime();
  if (Number.isNaN(capturedAt)) return flag('telemetry_consistency', 'invalid_captured_at');
  const skewMs = serverReceivedAt.getTime() - capturedAt;
  if (skewMs < -60_000) return flag('telemetry_consistency', 'captured_at_in_future');
  if (skewMs > 24 * 60 * 60 * 1000) return flag('telemetry_consistency', 'captured_at_too_old');
  return pass('telemetry_consistency');
}

/** Velocity between this capture and the user's last one — impossible = spoofed GPS. */
export async function impossibleTravelDetector(bundle, { repository, userId }) {
  if (!bundle.gps) return pass('impossible_travel');
  const lastCapture = await repository.getLastCaptureLocation?.(userId);
  if (!lastCapture?.gps || !lastCapture.capturedAt) return pass('impossible_travel');

  const distanceM = haversineMeters(lastCapture.gps, bundle.gps);
  const elapsedS = Math.max(1, (new Date(bundle.capturedAt).getTime() - new Date(lastCapture.capturedAt).getTime()) / 1000);
  const speedMps = distanceM / elapsedS;
  if (speedMps > MAX_HUMAN_SPEED_MPS) return reject('impossible_travel', 'velocity_exceeds_human_possible');
  return pass('impossible_travel');
}

/** Same photo submitted twice in a short window. */
export async function duplicateWindowDetector(bundle, { repository, userId }) {
  if (!bundle.imageHash) return pass('duplicate_window');
  const seen = await repository.hasSimilarCaptureImageHash?.(userId, bundle.imageHash);
  if (seen) return flag('duplicate_window', 'near_identical_recent_capture');
  return pass('duplicate_window');
}

const DEFAULT_DETECTORS = [
  livenessDetector,
  screenshotDetector,
  aiGeneratedDetector,
  printedPhotoDetector,
  internetDuplicateDetector,
  telemetryConsistencyDetector,
  impossibleTravelDetector,
  duplicateWindowDetector,
];

export async function antiCheatVerdict(bundle, context, detectors = DEFAULT_DETECTORS) {
  const results = await Promise.all(detectors.map((detector) => detector(bundle, context)));

  const hardFail = results.find((result) => result.verdict === AntiCheatVerdict.REJECT);
  if (hardFail) return { verdict: GateVerdict.REJECT, reason: hardFail.reason, detector: hardFail.detector, results };

  const softFlags = results.filter((result) => result.verdict === AntiCheatVerdict.FLAG);
  if (softFlags.length >= FLAG_THRESHOLD) {
    return { verdict: GateVerdict.REJECT, reason: 'multiple_integrity_flags', results };
  }
  if (softFlags.length >= 1) {
    return { verdict: GateVerdict.PASS_WITH_REVIEW, reason: softFlags[0].reason, results };
  }
  return { verdict: GateVerdict.PASS, reason: null, results };
}

function haversineMeters(a, b) {
  const R = 6_371_000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export { FLAG_THRESHOLD };
