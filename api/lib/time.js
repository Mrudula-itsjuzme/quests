const formatterCache = new Map();

function formatter(timeZone) {
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(timeZone, new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }));
  }
  return formatterCache.get(timeZone);
}

export function assertTimeZone(timeZone) {
  try {
    formatter(timeZone).format(new Date());
    return timeZone;
  } catch {
    throw new Error('invalid_timezone');
  }
}

export function zonedParts(date, timeZone) {
  const parts = Object.fromEntries(formatter(assertTimeZone(timeZone)).formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function dailyPeriod(now, timeZone) {
  const current = zonedParts(now, timeZone);
  const key = `${current.year}-${String(current.month).padStart(2, '0')}-${String(current.day).padStart(2, '0')}`;
  const nextDate = new Date(Date.UTC(current.year, current.month - 1, current.day + 1));
  const expiresAt = localMidnightToUtc(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, nextDate.getUTCDate(), timeZone);
  return { key, startsAt: localMidnightToUtc(current.year, current.month, current.day, timeZone), expiresAt };
}

export function weeklyPeriod(now) {
  const date = new Date(now);
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const startsAt = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - daysSinceMonday));
  const expiresAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { key: startsAt.toISOString().slice(0, 10), startsAt, expiresAt };
}

function localMidnightToUtc(year, month, day, timeZone) {
  let candidate = new Date(Date.UTC(year, month - 1, day));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = zonedParts(candidate, timeZone);
    const represented = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
    const desired = Date.UTC(year, month - 1, day);
    candidate = new Date(candidate.getTime() + desired - represented);
  }
  return candidate;
}

