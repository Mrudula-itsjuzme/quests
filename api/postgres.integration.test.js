import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migrate.js';
import { PostgresQuestRepository } from './lib/postgres-repository.js';
import { QuestEngine } from './lib/quest-engine.js';
import { createProviders } from './lib/providers.js';
import { speciesCatalog } from './lib/species-catalog.js';

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
    await pool.query('TRUNCATE quest_idempotency_keys, quest_xp_ledger, quest_submissions, collectible_unlocks, quest_daily_states, quest_generation_runs, quest_assignments, coin_ledger, community_post_likes, community_post_comments, community_posts, community_friendships, quest_users CASCADE');
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

  describe('world hotspots', () => {
    it('serves the seeded curated locations', async () => {
      const all = await repository.listWorldHotspots();
      expect(all.length).toBeGreaterThan(0);
      expect(all.every((spot) => spot.isDemo)).toBe(true);
    });

    it('returns coordinates as numbers on the correct axes', async () => {
      const all = await repository.listWorldHotspots();
      const jog = all.find((spot) => spot.id === 'demo-jog-falls');
      // Jog Falls is ~14.23N, ~74.81E. A swapped pair would put latitude at
      // 74.81, which no range check can catch — so assert the values directly.
      expect(jog.gps.lat).toBeCloseTo(14.2295, 4);
      expect(jog.gps.lng).toBeCloseTo(74.8126, 4);
      expect(typeof jog.gps.lat).toBe('number');
      expect(typeof jog.gps.lng).toBe('number');
    });

    it('filters by category', async () => {
      const falls = await repository.listWorldHotspots({ category: 'Waterfalls' });
      expect(falls.length).toBeGreaterThan(0);
      expect(falls.every((spot) => spot.category === 'Waterfalls')).toBe(true);
    });

    it('filters by bounding box without mixing up the axes', async () => {
      const inBox = await repository.listWorldHotspots({
        bbox: { minLat: 11, maxLat: 14, minLng: 74, maxLng: 78 },
      });
      expect(inBox.length).toBeGreaterThan(0);
      for (const spot of inBox) {
        expect(spot.gps.lat).toBeGreaterThanOrEqual(11);
        expect(spot.gps.lat).toBeLessThanOrEqual(14);
        expect(spot.gps.lng).toBeGreaterThanOrEqual(74);
        expect(spot.gps.lng).toBeLessThanOrEqual(78);
      }
      // Valley of Flowers sits at ~30.7N, well outside the box.
      expect(inBox.some((spot) => spot.id === 'demo-valley-of-flowers')).toBe(false);
    });

    it('rejects an out-of-range latitude at the database level', async () => {
      await expect(pool.query(
        "INSERT INTO world_hotspots (id,name,category,lat,lng) VALUES ('bad-lat','Bad','Parks',95,12)",
      )).rejects.toThrow();
    });

    it('references only species that exist in the catalog', async () => {
      const all = await repository.listWorldHotspots();
      const known = new Set(speciesCatalog.map((entry) => entry.id));
      for (const spot of all) {
        for (const id of spot.featuredSpecies) {
          expect(known.has(id), `${spot.id} references unknown species ${id}`).toBe(true);
        }
      }
    });
  });

  describe('coin wallet', () => {
    it('credits coins for a final capture and leaves provisional captures uncredited', async () => {
      await repository.ensureUser(identity);
      await repository.createCapturedCard({
        userId: identity.id, itemName: 'Bengal Tiger', category: 'Fauna', cardTitle: 'Bengal Tiger',
        rarityTier: 'B', rarityScore: 0.64, description: '', status: 'final', xpAwarded: 250, coinsAwarded: 40,
      });
      expect(await repository.getCoinBalance(identity.id)).toBe(40);

      await repository.createCapturedCard({
        userId: identity.id, itemName: 'Red Fox', category: 'Fauna', cardTitle: 'Red Fox',
        rarityTier: 'A', rarityScore: 0.8, description: '', status: 'provisional', xpAwarded: 500, coinsAwarded: 100,
      });
      expect(await repository.getCoinBalance(identity.id)).toBe(40);
    });

    it('keeps each capture credit unique so a replay cannot double-pay', async () => {
      await repository.ensureUser(identity);
      const card = await repository.createCapturedCard({
        userId: identity.id, itemName: 'Barn Owl', category: 'Fauna', cardTitle: 'Barn Owl',
        rarityTier: 'B', rarityScore: 0.6, description: '', status: 'final', xpAwarded: 250, coinsAwarded: 40,
      });
      await pool.query(
        `INSERT INTO coin_ledger (id, ledger_key, user_id, card_id, amount, reason)
         VALUES (gen_random_uuid(), $1, $2, $3, 40, 'capture_reward') ON CONFLICT (ledger_key) DO NOTHING`,
        [`capture:${card.id}`, identity.id, card.id],
      );
      expect(await repository.getCoinBalance(identity.id)).toBe(40);
    });
  });

  describe('community', () => {
    it('stores a shared discovery and reads it back with author and card data', async () => {
      await repository.ensureUser(identity);
      const card = await repository.createCapturedCard({
        userId: identity.id, itemName: 'Indian Roller', category: 'Fauna', cardTitle: 'Indian Roller',
        rarityTier: 'B', rarityScore: 0.6, description: '', status: 'final',
        rarityGrade: 'B', rarityStars: 3, xpAwarded: 250, coinsAwarded: 40,
      });
      const { post, created } = await repository.createCommunityPost({
        userId: identity.id, cardId: card.id, caption: 'On the wire at dawn.', hashtags: ['#birding'],
      });
      expect(created).toBe(true);
      expect(post.discovery.itemName).toBe('Indian Roller');
      expect(post.discovery.rarityStars).toBe(3);
      expect(post.author.rankTitle).toBe('Adventurer');
      expect(post.hashtags).toEqual(['#birding']);

      const feed = await repository.listCommunityPosts(identity.id);
      expect(feed.map((item) => item.id)).toEqual([post.id]);
    });

    it('refuses to create a second post for the same capture', async () => {
      await repository.ensureUser(identity);
      const card = await repository.createCapturedCard({
        userId: identity.id, itemName: 'Common Myna', category: 'Fauna', cardTitle: 'Common Myna',
        rarityTier: 'D', rarityScore: 0.1, description: '', status: 'final',
      });
      const first = await repository.createCommunityPost({ userId: identity.id, cardId: card.id });
      const second = await repository.createCommunityPost({ userId: identity.id, cardId: card.id });
      expect(second.created).toBe(false);
      expect(second.post.id).toBe(first.post.id);
      expect((await pool.query('SELECT COUNT(*)::int AS count FROM community_posts')).rows[0].count).toBe(1);
    });

    it('recomputes like counts so repeated likes cannot inflate the total', async () => {
      await repository.ensureUser(identity);
      const card = await repository.createCapturedCard({
        userId: identity.id, itemName: 'Spotted Deer', category: 'Fauna', cardTitle: 'Spotted Deer',
        rarityTier: 'C', rarityScore: 0.3, description: '', status: 'final',
      });
      const { post } = await repository.createCommunityPost({ userId: identity.id, cardId: card.id });

      await repository.setCommunityPostLike(identity.id, post.id, true);
      const twice = await repository.setCommunityPostLike(identity.id, post.id, true);
      expect(twice.likeCount).toBe(1);
      expect(twice.viewerLiked).toBe(true);

      const removed = await repository.setCommunityPostLike(identity.id, post.id, false);
      expect(removed.likeCount).toBe(0);
      expect(removed.viewerLiked).toBe(false);
    });

    it('keeps the comment counter in step with stored comments', async () => {
      await repository.ensureUser(identity);
      const card = await repository.createCapturedCard({
        userId: identity.id, itemName: 'Grey Mongoose', category: 'Fauna', cardTitle: 'Grey Mongoose',
        rarityTier: 'C', rarityScore: 0.3, description: '', status: 'final',
      });
      const { post } = await repository.createCommunityPost({ userId: identity.id, cardId: card.id });
      await repository.createCommunityComment(identity.id, post.id, 'Great find.');

      expect(await repository.listCommunityComments(post.id)).toHaveLength(1);
      expect((await repository.getCommunityPost(identity.id, post.id)).commentCount).toBe(1);
    });

    it('never deletes a post belonging to another user', async () => {
      await repository.ensureUser(identity);
      const card = await repository.createCapturedCard({
        userId: identity.id, itemName: 'Palm Squirrel', category: 'Fauna', cardTitle: 'Palm Squirrel',
        rarityTier: 'D', rarityScore: 0.1, description: '', status: 'final',
      });
      const { post } = await repository.createCommunityPost({ userId: identity.id, cardId: card.id });

      await repository.ensureUser({ id: 'intruder', displayName: 'Intruder', timezone: 'UTC' });
      expect(await repository.deleteCommunityPost('intruder', post.id)).toBe(false);
      expect(await repository.getCommunityPost(identity.id, post.id)).not.toBeNull();

      expect(await repository.deleteCommunityPost(identity.id, post.id)).toBe(true);
    });
  });
});
