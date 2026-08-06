/**
 * Blueprint §16.1 weights. Three factors (regionalRarity, discoveryFrequency,
 * weather) have no live data source yet and return a neutral 0.5 from their
 * computers below — until those feeds exist, the highest reachable score is
 * capped well short of 100 (an S-grade Legendary is effectively unreachable
 * even for a maximally rare, first-ever discovery). Re-balance once each
 * factor has a real signal; do not fake the missing ones to hit S-grade.
 */
export const DEFAULT_WEIGHTS = Object.freeze({
  speciesBaseRarity: 0.28,
  regionalRarity: 0.16,
  discoveryFrequency: 0.14,
  seasonality: 0.10,
  timeOfDay: 0.06,
  weather: 0.06,
  photoQuality: 0.08,
  distanceTravelled: 0.06,
  firstDiscoveryBonus: 0.06,
});

export const DEFAULT_GRADE_BANDS = Object.freeze({
  D: [0, 40],
  C: [40, 60],
  B: [60, 75],
  A: [75, 90],
  S: [90, 101],
});

const GRADE_REWARDS = Object.freeze({
  D: { label: 'Common', xp: 50, coins: 5, humanReview: false },
  C: { label: 'Uncommon', xp: 120, coins: 15, humanReview: false },
  B: { label: 'Rare', xp: 250, coins: 40, humanReview: false },
  A: { label: 'Epic', xp: 500, coins: 100, humanReview: true },
  S: { label: 'Legendary', xp: 850, coins: 250, humanReview: true },
});

const LOW_TELEMETRY_SCORE_CAP = 74;
const EARTH_RADIUS_M = 6_371_000;

export function gradeForScore(score, gradeBands = DEFAULT_GRADE_BANDS) {
  for (const [grade, [min, max]] of Object.entries(gradeBands)) {
    if (score >= min && score < max) return grade;
  }
  return 'S';
}

export function starsForScore(score) {
  return Math.min(5, Math.max(1, Math.round(score / 20)));
}

export function rewardsForGrade(grade) {
  return GRADE_REWARDS[grade] || GRADE_REWARDS.D;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

/** Global scarcity of the species in the catalog (0 = common, 1 = ultra-rare). */
function speciesBaseRarityFactor({ species }) {
  return clamp01(species?.baseRarity ?? 0.3);
}

/**
 * Uncommon-for-region signal. Honest placeholder until per-region sighting
 * density is tracked (blueprint §16.1) — neutral until that data exists.
 */
function regionalRarityFactor() {
  return 0.5;
}

/** How rarely this species is captured game-wide, relative to total captures. */
function discoveryFrequencyFactor({ discoveryStats }) {
  if (!discoveryStats || discoveryStats.totalCount === 0) return 0.5;
  const shareOfAllCaptures = discoveryStats.speciesCount / discoveryStats.totalCount;
  return clamp01(1 - shareOfAllCaptures * 10);
}

/** Out-of-season / migratory timing — 1.0 if captured outside the species' listed active months. */
function seasonalityFactor({ species, capturedAt }) {
  const months = species?.seasonalityMonths;
  if (!months || months.length === 0) return 0.5;
  const month = new Date(capturedAt).getUTCMonth() + 1;
  return months.includes(month) ? 0.2 : 0.9;
}

/** Nocturnal/crepuscular subjects captured at the right hour score higher. */
function timeOfDayFactor({ species, capturedAt }) {
  if (!species?.nocturnal) return 0.4;
  const hour = new Date(capturedAt).getUTCHours();
  const isNight = hour >= 19 || hour < 6;
  return isNight ? 0.9 : 0.2;
}

/**
 * Adverse/rare weather conditions at capture. Honest placeholder until a
 * weather-at-capture snapshot is wired in — neutral until that data exists.
 */
function weatherFactor() {
  return 0.5;
}

/** Sharpness/framing/subject prominence. Honest placeholder until an image-quality model runs. */
function photoQualityFactor({ confidence }) {
  return clamp01(confidence ?? 0.6);
}

/** Effort: distance from the player's last capture. */
function distanceTravelledFactor({ gps, lastCaptureGps }) {
  if (!gps || !lastCaptureGps) return 0.3;
  const distanceM = haversineMeters(lastCaptureGps, gps);
  return clamp01(distanceM / 5000);
}

/** First-ever (global) or first-for-player bonus. */
function firstDiscoveryBonusFactor({ isFirstForPlayer, isFirstGlobal }) {
  if (isFirstGlobal) return 1;
  if (isFirstForPlayer) return 0.6;
  return 0;
}

const FACTOR_COMPUTERS = {
  speciesBaseRarity: speciesBaseRarityFactor,
  regionalRarity: regionalRarityFactor,
  discoveryFrequency: discoveryFrequencyFactor,
  seasonality: seasonalityFactor,
  timeOfDay: timeOfDayFactor,
  weather: weatherFactor,
  photoQuality: photoQualityFactor,
  distanceTravelled: distanceTravelledFactor,
  firstDiscoveryBonus: firstDiscoveryBonusFactor,
};

export function scoreDiscovery(input, weightSet = { version: 1, weights: DEFAULT_WEIGHTS, gradeBands: DEFAULT_GRADE_BANDS }) {
  const weights = weightSet.weights || DEFAULT_WEIGHTS;
  const gradeBands = weightSet.gradeBands || DEFAULT_GRADE_BANDS;

  const factorBreakdown = {};
  let rawScore = 0;
  for (const [factor, weight] of Object.entries(weights)) {
    const compute = FACTOR_COMPUTERS[factor];
    const value = compute ? clamp01(compute(input)) : 0;
    factorBreakdown[factor] = value;
    rawScore += weight * value;
  }

  let score = Math.round(clamp01(rawScore) * 100);

  const lowTelemetry = !input.gps || (input.gps.accuracyM != null && input.gps.accuracyM > 100);
  if (lowTelemetry) score = Math.min(score, LOW_TELEMETRY_SCORE_CAP);

  const grade = gradeForScore(score, gradeBands);
  const stars = starsForScore(score);
  const rewards = rewardsForGrade(grade);

  return {
    score,
    grade,
    stars,
    factorBreakdown,
    weightSetVersion: weightSet.version,
    lowTelemetryCapped: lowTelemetry,
    xp: rewards.xp,
    coins: rewards.coins,
    label: rewards.label,
    humanReview: rewards.humanReview,
  };
}

function haversineMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}
