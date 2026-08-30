export const AntiCheatVerdict = Object.freeze({ PASS: 'PASS', FLAG: 'FLAG', REJECT: 'REJECT' });
export const GateVerdict = Object.freeze({
  PASS: 'PASS',
  PASS_WITH_REVIEW: 'PASS_WITH_REVIEW',
  REJECT: 'REJECT',
});

const FLAG_THRESHOLD = 2;
const MAX_HUMAN_SPEED_MPS = 120;

function pass(detector, reason = null, implemented = true) {
  return { detector, verdict: AntiCheatVerdict.PASS, reason, implemented };
}
function flag(detector, reason) {
  return { detector, verdict: AntiCheatVerdict.FLAG, reason, implemented: true };
}
function reject(detector, reason) {
  return { detector, verdict: AntiCheatVerdict.REJECT, reason, implemented: true };
}
/** A detector that always passes because no real check has been wired in yet — never counts as evidence of authenticity. */
function unimplementedPass(detector) {
  return pass(detector, 'detector_not_implemented', false);
}

/**
 * Client-attested liveness sanity check. `attested` reflects the browser's
 * live-capture input hint, not a cryptographic proof (see captureTelemetry.js)
 * — real screenshots and re-saved images frequently lack EXIF data, so its
 * absence is treated as corroborating (soft) evidence, not a hard fail, since
 * some browsers legitimately strip EXIF from genuine live captures too.
 */
export function livenessDetector(bundle) {
  if (!bundle.liveness?.attested) return flag('liveness', 'not_attested');
  if (bundle.exif && bundle.exif.hasExif === false) return flag('liveness', 'no_exif_data');
  return pass('liveness');
}

/** Screenshot/screen-recapture classifier — NOT YET IMPLEMENTED (blueprint §15.1). Always passes; logged as such. */
export function screenshotDetector(_bundle) {
  return unimplementedPass('screenshot');
}

/** Generative-image (Midjourney/SD/GAN) classifier — NOT YET IMPLEMENTED. Always passes; logged as such. */
export function aiGeneratedDetector(_bundle) {
  return unimplementedPass('ai_generated');
}

/** Printed-photo / re-photograph classifier — NOT YET IMPLEMENTED. Always passes; logged as such. */
export function printedPhotoDetector(_bundle) {
  return unimplementedPass('printed_photo');
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
  const elapsedS = (new Date(bundle.capturedAt).getTime() - new Date(lastCapture.capturedAt).getTime()) / 1000;
  if (elapsedS <= 0) return flag('impossible_travel', 'negative_or_zero_elapsed_time');

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
  const unimplementedDetectors = results.filter((result) => result.implemented === false).map((result) => result.detector);

  const hardFail = results.find((result) => result.verdict === AntiCheatVerdict.REJECT);
  if (hardFail) return { verdict: GateVerdict.REJECT, reason: hardFail.reason, detector: hardFail.detector, results, unimplementedDetectors };

  const softFlags = results.filter((result) => result.verdict === AntiCheatVerdict.FLAG);
  if (softFlags.length >= FLAG_THRESHOLD) {
    return { verdict: GateVerdict.REJECT, reason: 'multiple_integrity_flags', results, unimplementedDetectors };
  }
  if (softFlags.length >= 1) {
    return { verdict: GateVerdict.PASS_WITH_REVIEW, reason: softFlags[0].reason, results, unimplementedDetectors };
  }
  return { verdict: GateVerdict.PASS, reason: null, results, unimplementedDetectors };
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
