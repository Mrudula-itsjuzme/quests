import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migrate.js';
import { PostgresQuestRepository } from './lib/postgres-repository.js';
import { QuestEngine } from './lib/quest-engine.js';
import { createProviders } from './lib/providers.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;

suite('PostgreSQL quest repository', () => {
  let pool;
  let engine;
  let repository;
  const identity = { id: 'integration-user', displayName: 'Integration', timezone: 'UTC' };

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    await runMigrations({ pool });
    await runMigrations({ pool });
    repository = new PostgresQuestRepository(pool);
    engine = new QuestEngine({ repository, providers: createProviders({ mode: 'local', now: () => new Date('2026-07-13T10:00:00.000Z') }), random: () => 0 });
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE quest_idempotency_keys, quest_xp_ledger, quest_submissions, collectible_unlocks, quest_daily_states, quest_generation_runs, quest_assignments, quest_users CASCADE');
  });

  afterAll(async () => { await pool?.end(); });

  it('keeps concurrent daily generation unique', async () => {
    const [first, second] = await Promise.all([
      engine.generateDaily(identity, 'integration-daily-001'),
      engine.generateDaily(identity, 'integration-daily-002'),
    ]);
    expect(first).toHaveLength(3);
    expect(second).toHaveLength(3);
    const active = await engine.active(identity);
    expect(active).toHaveLength(3);
    expect(new Set(active.map((item) => item.category))).toEqual(new Set(['Mind', 'Body', 'Discovery']));
    const runs = await pool.query("SELECT status, assignment_count FROM quest_generation_runs WHERE user_id = $1 AND cadence = 'daily'", [identity.id]);
    expect(runs.rows).toEqual([{ status: 'completed', assignment_count: 3 }]);
  });

  it('credits an assignment only once under replay', async () => {
    const [assignment] = await engine.generateDaily(identity, 'integration-daily-001');
    const first = await engine.completeLegacy(identity, assignment.id);
    const replay = await engine.completeLegacy(identity, assignment.id);
    expect(first.xpCredited).toBeGreaterThan(0);
    expect(replay.xpCredited).toBe(0);
    const me = await engine.getMe(identity);
    expect(me.totalXp).toBe(first.xpCredited);
  });

  it('persists profile preferences without changing XP or streak state', async () => {
    const before = await engine.getMe(identity);
    const updated = await engine.updateMe(identity, {
      displayName: 'Ari',
      timezone: 'Asia/Kolkata',
      primaryPath: 'Discovery',
      reminderTime: '20:30',
      motionPreference: 'reduced',
      onboardingCompleted: true,
      tourVersionSeen: 1,
    });
    expect(updated).toEqual(expect.objectContaining({
      displayName: 'Ari',
      primaryPath: 'Discovery',
      reminderTime: '20:30',
      motionPreference: 'reduced',
      tourVersionSeen: 1,
      totalXp: before.totalXp,
      streakDays: before.streakDays,
    }));
  });

  it('serializes concurrent completions and awards one daily bonus', async () => {
    const daily = await engine.generateDaily(identity, 'integration-daily-001');
    await Promise.all(daily.map((assignment) => engine.completeLegacy(identity, assignment.id)));
    const me = await engine.getMe(identity);
    const questXp = daily.reduce((sum, assignment) => sum + assignment.xpReward, 0);
    expect(me.totalXp).toBe(questXp + 150);
    expect(me.streakDays).toBe(1);
    const bonus = await pool.query("SELECT COUNT(*)::int AS count FROM quest_xp_ledger WHERE user_id = $1 AND reason = 'daily_bonus'", [identity.id]);
    expect(bonus.rows[0].count).toBe(1);
    const state = await pool.query('SELECT bonus_awarded, streak_applied, streak_after FROM quest_daily_states WHERE user_id = $1', [identity.id]);
    expect(state.rows).toEqual([{ bonus_awarded: true, streak_applied: true, streak_after: 1 }]);
  });

  it('rejects concurrent photo-hash reuse at the database boundary', async () => {
    const daily = await engine.generateDaily(identity, 'integration-daily-001');
    const weekly = await engine.generateWeekly(identity, 'integration-weekly-001');
    const photo = daily.find((assignment) => assignment.verificationType === 'PHOTO');
    const outcomes = await Promise.allSettled([
      engine.submit(identity, photo.id, { uploadId: 'local_concurrent1' }, 'integration-submit-001'),
      engine.submit(identity, weekly.id, { uploadId: 'local_concurrent1' }, 'integration-submit-002'),
    ]);
    expect(outcomes.filter((item) => item.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((item) => item.status === 'rejected')[0].reason).toMatchObject({ code: 'duplicate_submission' });
  });

  it('rolls back a generation run when any assignment insert fails', async () => {
    await repository.ensureUser(identity);
    const base = {
      userId: identity.id,
      title: 'Rollback probe',
      description: 'Rollback probe',
      rarity: 'Common',
      cadence: 'daily',
      verificationType: 'TEXT',
      subjectTag: 'rollback-probe',
      targetValue: 1,
      unit: 'proof',
      xpReward: 25,
      instructions: [],
      periodKey: '2026-07-13',
      assignedAt: '2026-07-13T10:00:00.000Z',
      startsAt: '2026-07-13T00:00:00.000Z',
      expiresAt: '2026-07-14T00:00:00.000Z',
    };
    await expect(repository.runGenerationTransaction({
      userId: identity.id,
      cadence: 'daily',
      periodKey: base.periodKey,
      idempotencyKey: 'rollback-generation-001',
      select: async () => [
        { ...base, definitionId: 'mind-read', category: 'Mind' },
        { ...base, definitionId: 'missing-definition', category: 'Body' },
      ],
    })).rejects.toBeTruthy();
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM quest_assignments WHERE user_id = $1', [identity.id])).rows[0].count).toBe(0);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM quest_generation_runs WHERE user_id = $1', [identity.id])).rows[0].count).toBe(0);
  });

  it('does not return another user assignment', async () => {
    const [assignment] = await engine.generateDaily(identity, 'integration-daily-001');
    expect(await repository.getAssignment('another-user', assignment.id)).toBeNull();
  });
});
