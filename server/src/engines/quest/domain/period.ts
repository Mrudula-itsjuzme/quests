import { QuestPeriod } from './quest.types';

function zonedDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function zonedMidnightUtc(dateKey: string, timezone: string): Date {
  // Binary-search-free approach: construct a UTC guess, then correct by comparing
  // the zoned key back — timezones with fixed offsets converge in one pass, all
  // real-world IANA zones converge within a couple corrections.
  let guess = new Date(`${dateKey}T00:00:00Z`);
  for (let i = 0; i < 4; i++) {
    const observedKey = zonedDateKey(guess, timezone);
    if (observedKey === dateKey) break;
    const diffDays = observedKey < dateKey ? 1 : -1;
    guess = new Date(guess.getTime() + diffDays * 3_600_000);
  }
  return guess;
}

export function dailyPeriod(now: Date, timezone: string): QuestPeriod {
  const key = zonedDateKey(now, timezone);
  const startsAt = zonedMidnightUtc(key, timezone);
  const expiresAt = new Date(startsAt.getTime() + 86_400_000);
  return { key: `daily:${key}`, startsAt, expiresAt };
}

export function weeklyPeriod(now: Date, timezone: string): QuestPeriod {
  const dateKey = zonedDateKey(now, timezone);
  const midnight = zonedMidnightUtc(dateKey, timezone);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(midnight);
  const dayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday);
  const daysSinceMonday = dayIndex === -1 ? 0 : dayIndex;
  const startsAt = new Date(midnight.getTime() - daysSinceMonday * 86_400_000);
  const expiresAt = new Date(startsAt.getTime() + 7 * 86_400_000);
  const weekKey = zonedDateKey(startsAt, timezone);
  return { key: `weekly:${weekKey}`, startsAt, expiresAt };
}

export function monthlyPeriod(now: Date, timezone: string): QuestPeriod {
  const [year, month] = zonedDateKey(now, timezone).split('-');
  const monthKey = `${year}-${month}`;
  const startsAt = zonedMidnightUtc(`${monthKey}-01`, timezone);
  const nextMonth = new Date(Date.UTC(startsAt.getUTCFullYear(), startsAt.getUTCMonth() + 1, 1));
  const expiresAt = zonedMidnightUtc(zonedDateKey(nextMonth, timezone), timezone);
  return { key: `monthly:${monthKey}`, startsAt, expiresAt };
}
