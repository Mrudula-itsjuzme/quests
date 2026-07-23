import { describe, expect, it } from 'vitest';
import { QuestEngine, calculateProgression } from './quest-engine.js';
import { questDefinitions } from './quest-definitions.js';
import { MemoryQuestRepository } from './memory-repository.js';
import { createProviders } from './providers.js';
import { rarityXp } from './quest-definitions.js';
import { dailyPeriod, weeklyPeriod } from './time.js';

const identity = { id: '00000000-0000-4000-8000-000000000001', displayName: 'Tester', timezone: 'UTC' };

function harness(start = '2026-07-13T10:00:00.000Z', random = () => 0) {
  let current = new Date(start);
  const repository = new MemoryQuestRepository({ definitions: questDefinitions });
  const providers = createProviders({ mode: 'local', now: () => new Date(current) });
  const engine = new QuestEngine({ repository, providers, random });
  return { engine, repository, setNow(value) { current = new Date(value); } };
}

describe('QuestEngine', () => {
  it('maps XP into the documented level tiers', () => {
    expect(calculateProgression(0)).toEqual(expect.objectContaining({ level: 1, tier: 'Bronze', xpForCurrentLevel: 250 }));
    expect(calculateProgression(5_000)).toEqual(expect.objectContaining({ level: 21, tier: 'Silver', xpForCurrentLevel: 500 }));
  });

  it('uses exact rarity XP defaults and timezone-safe cadence periods', () => {
    expect(rarityXp).toEqual({ Common: 25, Uncommon: 50, Rare: 100, Epic: 250, Legendary: 500 });
    expect(dailyPeriod(new Date('2026-03-08T07:30:00.000Z'), 'America/New_York')).toEqual(expect.objectContaining({ key: '2026-03-08' }));
    const week = weeklyPeriod(new Date('2026-07-19T23:59:59.000Z'));
    expect(week.key).toBe('2026-07-13');
    expect(week.expiresAt.toISOString()).toBe('2026-07-20T00:00:00.000Z');
  });

  it('creates daily and weekly periods idempotently', async () => {
    const { engine } = harness();
    const daily = await engine.generateDaily(identity, 'daily-key-001');
    const replay = await engine.generateDaily(identity, 'daily-key-001');
    const weekly = await engine.generateWeekly(identity, 'weekly-key-001');
    expect(daily).toHaveLength(3);
    expect(new Set(daily.map((item) => item.category))).toEqual(new Set(['Mind', 'Body', 'Discovery']));
    expect(replay).toEqual(daily);
    expect(weekly.verificationType).toBe('PHOTO');
    expect(weekly.cadence).toBe('weekly');
  });

  it('respects recent quest cooldowns on the next local day', async () => {
    const { engine, setNow } = harness();
    const first = await engine.generateDaily(identity, 'daily-key-001');
    setNow('2026-07-14T10:00:00.000Z');
    const second = await engine.generateDaily(identity, 'daily-key-002');
    expect(second.find((item) => item.category === 'Mind').definitionId).not.toBe(first.find((item) => item.category === 'Mind').definitionId);
    expect(second.find((item) => item.category === 'Body').definitionId).not.toBe(first.find((item) => item.category === 'Body').definitionId);
  });

  it('credits quest XP once and daily bonus/streak once', async () => {
    const { engine } = harness();
    const daily = await engine.generateDaily(identity, 'daily-key-001');
    let expectedQuestXp = 0;
    for (const assignment of daily) {
      expectedQuestXp += assignment.xpReward;
      await engine.completeLegacy(identity, assignment.id);
    }
    const replay = await engine.completeLegacy(identity, daily[2].id);
    const me = await engine.getMe(identity);
    expect(me.totalXp).toBe(expectedQuestXp + 150);
    expect(me.streakDays).toBe(1);
    expect(replay.xpCredited).toBe(0);
    expect(replay.bonusXp).toBe(0);
  });

  it('resets a broken streak and advances consecutive local days', async () => {
    const { engine, setNow } = harness();
    const first = await engine.generateDaily(identity, 'daily-key-001');
    await Promise.all(first.map((assignment) => engine.completeLegacy(identity, assignment.id)));
    setNow('2026-07-14T10:00:00.000Z');
    const second = await engine.generateDaily(identity, 'daily-key-002');
    await Promise.all(second.map((assignment) => engine.completeLegacy(identity, assignment.id)));
    expect((await engine.getMe(identity)).streakDays).toBe(2);

    setNow('2026-07-16T10:00:00.000Z');
    expect((await engine.getMe(identity)).streakDays).toBe(0);
    const fourth = await engine.generateDaily(identity, 'daily-key-004');
    await Promise.all(fourth.map((assignment) => engine.completeLegacy(identity, assignment.id)));
    expect((await engine.getMe(identity)).streakDays).toBe(1);
  });

  it('excludes the previous six weekly selections even across inactive gaps', async () => {
    const { engine, setNow } = harness('2026-01-05T10:00:00.000Z');
    const selected = [];
    for (let week = 0; week < 7; week += 1) {
      setNow(new Date(Date.UTC(2026, week === 0 ? 0 : week * 2, 5, 10)).toISOString());
      selected.push((await engine.generateWeekly(identity, `weekly-key-${week}`)).definitionId);
    }
    expect(new Set(selected).size).toBe(7);
  });

  it('expires assignments lazily and excludes them from active results', async () => {
    const { engine, setNow } = harness();
    await engine.generateDaily(identity, 'daily-key-001');
    setNow('2026-07-14T00:01:00.000Z');
    expect(await engine.active(identity)).toEqual([]);
    expect(await engine.history(identity)).toHaveLength(3);
  });

  it('rejects duplicate photo proof and supports safe local verification', async () => {
    const { engine } = harness();
    const daily = await engine.generateDaily(identity, 'daily-key-001');
    const photo = daily.find((item) => item.verificationType === 'PHOTO');
    const first = await engine.submit(identity, photo.id, { uploadId: 'local_abcdefgh', feedOptIn: true }, 'submit-key-001');
    expect(first.completed).toBe(true);

    const weekly = await engine.generateWeekly(identity, 'weekly-key-001');
    await expect(engine.submit(identity, weekly.id, { uploadId: 'local_abcdefgh' }, 'submit-key-002')).rejects.toMatchObject({ code: 'duplicate_submission' });
  });

  it('atomically rejects concurrent reuse of one photo', async () => {
    const { engine } = harness();
    const daily = await engine.generateDaily(identity, 'daily-key-001');
    const weekly = await engine.generateWeekly(identity, 'weekly-key-001');
    const photo = daily.find((item) => item.verificationType === 'PHOTO');
    const outcomes = await Promise.allSettled([
      engine.submit(identity, photo.id, { uploadId: 'local_concurrent1' }, 'submit-key-001'),
      engine.submit(identity, weekly.id, { uploadId: 'local_concurrent1' }, 'submit-key-002'),
    ]);
    expect(outcomes.filter((item) => item.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((item) => item.status === 'rejected')[0].reason).toMatchObject({ code: 'duplicate_submission' });
  });

  it('fails closed when production providers are unavailable', async () => {
    const repository = new MemoryQuestRepository({ definitions: questDefinitions });
    const providers = createProviders({ mode: 'disabled', now: () => new Date('2026-07-13T10:00:00.000Z') });
    const engine = new QuestEngine({ repository, providers, random: () => 0 });
    const daily = await engine.generateDaily(identity, 'daily-key-001');
    const photo = daily.find((item) => item.verificationType === 'PHOTO');
    await expect(engine.submit(identity, photo.id, { uploadId: 'local_abcdefgh' }, 'submit-key-001')).rejects.toMatchObject({ code: 'provider_not_configured' });
  });

  it('moves uncertain proof to review and abandons an attempt after three rejections', async () => {
    const repository = new MemoryQuestRepository({ definitions: questDefinitions });
    const providers = createProviders({ mode: 'local', now: () => new Date('2026-07-13T10:00:00.000Z') });
    const engine = new QuestEngine({ repository, providers, random: () => 0 });
    const firstDaily = await engine.generateDaily(identity, 'daily-key-001');
    const reviewPhoto = firstDaily.find((item) => item.verificationType === 'PHOTO');
    providers.photo.verify = async () => ({ confidence: 0.6, imageHash: 'review-hash' });
    const review = await engine.submit(identity, reviewPhoto.id, { uploadId: 'local_review001' }, 'review-key-001');
    expect(review.assignment.status).toBe('pending_verification');

    const weekly = await engine.generateWeekly(identity, 'weekly-key-001');
    let attempt = 0;
    providers.photo.verify = async () => ({ confidence: 0.1, imageHash: `reject-hash-${attempt += 1}` });
    let result;
    for (let index = 0; index < 3; index += 1) {
      result = await engine.submit(identity, weekly.id, { uploadId: `local_reject00${index}` }, `reject-key-00${index}`);
    }
    expect(result.assignment.status).toBe('abandoned');
  });
});
