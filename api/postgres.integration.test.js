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
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
    await runMigrations({ pool });
    await runMigrations({ pool });
    repository = new PostgresQuestRepository(pool);
    engine = new QuestEngine({ repository, providers: createProviders({ mode: 'local', now: () => new Date('2026-07-13T10:00:00.000Z') }), random: () => 0 });
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE quest_idempotency_keys, quest_xp_ledger, quest_submissions, collectible_unlocks, quest_daily_states, quest_generation_runs, quest_assignments, coin_ledger, inventory, regional_event_contributors, regional_events, community_post_reports, community_post_likes, community_post_comments, community_posts, community_friendships, account_deletion_requests, quest_users CASCADE');
  });

  afterAll(async () => { await pool?.end(); });

  it('keeps concurrent daily generation unique', async () => {
    const [first, second] = await Promise.all([
      engine.generateDaily(identity, 'integration-daily-001'),
      engine.generateDaily(identity, 'integration-daily-002'),
    ]);
    expect(first).toHaveLength(10);
    expect(second).toHaveLength(10);
    const active = await engine.active(identity);
    expect(active).toHaveLength(10);
    expect(active.filter((item) => item.category === 'Discovery')).toHaveLength(4);
    expect(active.filter((item) => item.category === 'Body')).toHaveLength(3);
    expect(active.filter((item) => item.category === 'Mind')).toHaveLength(3);
    expect(new Set(active.map((item) => item.definitionId)).size).toBe(10);
    const runs = await pool.query("SELECT status, assignment_count FROM quest_generation_runs WHERE user_id = $1 AND cadence = 'daily'", [identity.id]);
    expect(runs.rows).toEqual([{ status: 'completed', assignment_count: 10 }]);
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
    it('coalesces concurrent retries for one captureId without double-paying', async () => {
      await repository.ensureUser(identity);
      const captureId = '3f277e7e-5ebd-4e0f-86c8-b75c41ed98cb';
      const payload = {
        userId: identity.id, captureId, itemName: 'Barn Owl', category: 'Fauna', cardTitle: 'Barn Owl',
        rarityTier: 'B', rarityScore: 0.6, description: '', status: 'final', xpAwarded: 250, coinsAwarded: 40,
      };
      const [first, retry] = await Promise.all([
        repository.createCapturedCard(payload),
        repository.createCapturedCard(payload),
      ]);
      expect(retry.id).toBe(first.id);
      expect(await repository.getCoinBalance(identity.id)).toBe(40);
      expect((await repository.getUser(identity.id)).totalXp).toBe(250);
      expect((await pool.query('SELECT COUNT(*)::int AS count FROM captured_cards WHERE capture_id = $1', [captureId])).rows[0].count).toBe(1);
    });

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

    it('serializes concurrent approvals and credits provisional rewards once', async () => {
      await repository.ensureUser(identity);
      const card = await repository.createCapturedCard({
        userId: identity.id, itemName: 'Snow Leopard', category: 'Fauna', cardTitle: 'Snow Leopard',
        rarityTier: 'S', rarityScore: 0.99, description: '', status: 'provisional', xpAwarded: 1000, coinsAwarded: 250,
      });
      const [first, retry] = await Promise.all([
        repository.reviewCapturedCard(card.id, { decision: 'approve', reviewerId: 'admin', reason: null }),
        repository.reviewCapturedCard(card.id, { decision: 'approve', reviewerId: 'admin', reason: null }),
      ]);
      expect([first.status, retry.status]).toEqual(['final', 'final']);
      expect(await repository.getCoinBalance(identity.id)).toBe(250);
      expect((await repository.getUser(identity.id)).totalXp).toBe(1000);
      expect((await pool.query('SELECT COUNT(*)::int AS count FROM capture_xp_ledger WHERE card_id = $1', [card.id])).rows[0].count).toBe(1);
    });
  });

  describe('level rewards', () => {
    it('serializes concurrent claims and credits an XP reward once', async () => {
      await repository.ensureUser(identity);
      await pool.query('INSERT INTO quest_user_rewards (user_id, level) VALUES ($1, 21)', [identity.id]);
      const [first, retry] = await Promise.all([
        repository.claimRewards(identity.id),
        repository.claimRewards(identity.id),
      ]);
      expect(first.length + retry.length).toBe(1);
      expect((await repository.getUser(identity.id)).totalXp).toBe(250);
      expect((await pool.query("SELECT COUNT(*)::int AS count FROM quest_xp_ledger WHERE user_id = $1 AND reason = 'level_reward'", [identity.id])).rows[0].count).toBe(1);
    });
  });

  describe('store purchase integrity', () => {
    async function fund(amount = 1000) {
      await repository.ensureUser(identity);
      await pool.query(
        "INSERT INTO coin_ledger (id, ledger_key, user_id, amount, reason) VALUES (gen_random_uuid(), $1, $2, $3, 'test_funding')",
        [`fund:${identity.id}`, identity.id, amount],
      );
    }

    it('atomically charges a normal purchase and creates one inventory row', async () => {
      await fund();
      const result = await repository.purchaseStoreItem(identity.id, 'bronze_chest', 'store-request-001');
      expect(result).toEqual({ success: true, itemId: 'bronze_chest', priceCoins: 100, balance: 900 });
      expect(await repository.getCoinBalance(identity.id)).toBe(900);
      expect((await pool.query('SELECT quantity FROM inventory WHERE user_id=$1 AND item_id=$2', [identity.id, 'bronze_chest'])).rows).toEqual([{ quantity: 1 }]);
    });

    it('returns the original response for duplicate retry and later replay', async () => {
      await fund();
      const first = await repository.purchaseStoreItem(identity.id, 'bronze_chest', 'store-request-002');
      const retry = await repository.purchaseStoreItem(identity.id, 'bronze_chest', 'store-request-002');
      const laterReplay = await repository.purchaseStoreItem(identity.id, 'bronze_chest', 'store-request-002');
      expect(retry).toEqual(first);
      expect(laterReplay).toEqual(first);
      expect(await repository.getCoinBalance(identity.id)).toBe(900);
    });

    it('coalesces concurrent duplicate purchases into one charge and grant', async () => {
      await fund();
      const [first, retry] = await Promise.all([
        repository.purchaseStoreItem(identity.id, 'silver_chest', 'store-request-003'),
        repository.purchaseStoreItem(identity.id, 'silver_chest', 'store-request-003'),
      ]);
      expect(retry).toEqual(first);
      expect(await repository.getCoinBalance(identity.id)).toBe(700);
      expect((await pool.query('SELECT quantity FROM inventory WHERE user_id=$1 AND item_id=$2', [identity.id, 'silver_chest'])).rows[0].quantity).toBe(1);
    });

    it('rolls back an insufficient-funds purchase without ledger, inventory, or stale request state', async () => {
      await fund(50);
      await expect(repository.purchaseStoreItem(identity.id, 'bronze_chest', 'store-request-004')).rejects.toThrow('INSUFFICIENT_FUNDS');
      expect(await repository.getCoinBalance(identity.id)).toBe(50);
      expect((await pool.query('SELECT COUNT(*)::int AS count FROM inventory WHERE user_id=$1', [identity.id])).rows[0].count).toBe(0);
      expect((await pool.query("SELECT COUNT(*)::int AS count FROM quest_idempotency_keys WHERE user_id=$1 AND operation='store_purchase'", [identity.id])).rows[0].count).toBe(0);
    });

    it('enforces one ledger event and one inventory row per idempotent purchase', async () => {
      await fund();
      await repository.purchaseStoreItem(identity.id, 'bronze_chest', 'store-request-005');
      await repository.purchaseStoreItem(identity.id, 'bronze_chest', 'store-request-005');
      expect((await pool.query("SELECT COUNT(*)::int AS count FROM coin_ledger WHERE user_id=$1 AND reason='store_purchase'", [identity.id])).rows[0].count).toBe(1);
      expect((await pool.query('SELECT COUNT(*)::int AS count, SUM(quantity)::int AS quantity FROM inventory WHERE user_id=$1 AND item_id=$2', [identity.id, 'bronze_chest'])).rows[0]).toEqual({ count: 1, quantity: 1 });
    });
  });

  describe('regional chest integrity', () => {
    async function grantChest(chestId = 'event_chest_1', quantity = 1) {
      await repository.ensureUser(identity);
      await pool.query('INSERT INTO inventory (user_id, item_id, quantity) VALUES ($1,$2,$3)', [identity.id, chestId, quantity]);
    }

    it('consumes and rewards the first regional chest claim exactly once', async () => {
      await grantChest();
      const result = await repository.openChest(identity.id, 'event_chest_1', 'region-a', 'chest-request-001', { coins: 25, items: [] });
      expect(result).toEqual(expect.objectContaining({ chestId: 'event_chest_1', regionId: 'region-a', loot: { coins: 25, items: [] } }));
      expect(await repository.getCoinBalance(identity.id)).toBe(25);
      expect((await pool.query('SELECT quantity FROM inventory WHERE user_id=$1 AND item_id=$2', [identity.id, 'event_chest_1'])).rows[0].quantity).toBe(0);
      expect(result.event.counter).toBe(1);
    });

    it('returns the first result for repeated and concurrent requests without duplicate rewards', async () => {
      await grantChest('event_chest_1', 2);
      const [first, concurrent] = await Promise.all([
        repository.openChest(identity.id, 'event_chest_1', 'region-a', 'chest-request-002', { coins: 31, items: [] }),
        repository.openChest(identity.id, 'event_chest_1', 'region-a', 'chest-request-002', { coins: 99, items: [] }),
      ]);
      const replay = await repository.openChest(identity.id, 'event_chest_1', 'region-a', 'chest-request-002', { coins: 77, items: [] });
      expect(concurrent.loot).toEqual(first.loot);
      expect(replay.loot).toEqual(first.loot);
      expect(await repository.getCoinBalance(identity.id)).toBe(first.loot.coins);
      expect((await pool.query('SELECT quantity FROM inventory WHERE user_id=$1 AND item_id=$2', [identity.id, 'event_chest_1'])).rows[0].quantity).toBe(1);
      expect((await pool.query("SELECT COUNT(*)::int AS count FROM coin_ledger WHERE user_id=$1 AND reason='chest_loot'", [identity.id])).rows[0].count).toBe(1);
      expect((await pool.query('SELECT COUNT(*)::int AS count FROM regional_event_contributors WHERE user_id=$1', [identity.id])).rows[0].count).toBe(1);
    });

    it('rejects an already-opened chest under a new request without changing the economy', async () => {
      await grantChest('bronze_chest');
      await repository.openChest(identity.id, 'bronze_chest', null, 'chest-request-003', { coins: 20, items: [] });
      await expect(repository.openChest(identity.id, 'bronze_chest', null, 'chest-request-004', { coins: 50, items: [] })).rejects.toThrow('Chest not found in inventory');
      expect(await repository.getCoinBalance(identity.id)).toBe(20);
      expect((await pool.query("SELECT COUNT(*)::int AS count FROM coin_ledger WHERE user_id=$1 AND reason='chest_loot'", [identity.id])).rows[0].count).toBe(1);
      expect((await pool.query("SELECT COUNT(*)::int AS count FROM quest_idempotency_keys WHERE user_id=$1 AND operation='chest_open'", [identity.id])).rows[0].count).toBe(1);
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
      expect(post.author.rankTitle).toBe('Bronze Explorer I');
      expect(post.hashtags).toEqual(['#birding']);

      const feed = await repository.listCommunityPosts(identity.id);
      expect(feed.map((item) => item.id)).toEqual([post.id]);
    });

    it('refuses to create a second post for the same capture', async () => {
      await repository.ensureUser(identity);
      const card = await repository.createCapturedCard({
        userId: identity.id, itemName: 'Common Myna', category: 'Fauna', cardTitle: 'Common Myna',
        rarityTier: 'D', rarityScore: 0.6, rarityStars: 3, description: '', status: 'final',
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

      expect(await repository.listCommunityComments(identity.id, post.id)).toHaveLength(1);
      expect((await repository.getCommunityPost(identity.id, post.id)).commentCount).toBe(1);
    });

    it('never deletes a post belonging to another user', async () => {
      await repository.ensureUser(identity);
      const card = await repository.createCapturedCard({
        userId: identity.id, itemName: 'Palm Squirrel', category: 'Fauna', cardTitle: 'Palm Squirrel',
        rarityTier: 'D', rarityScore: 0.6, rarityStars: 3, description: '', status: 'final',
      });
      const { post } = await repository.createCommunityPost({ userId: identity.id, cardId: card.id });

      await repository.ensureUser({ id: 'intruder', displayName: 'Intruder', timezone: 'UTC' });
      expect(await repository.deleteCommunityPost('intruder', post.id)).toBe(false);
      expect(await repository.getCommunityPost(identity.id, post.id)).not.toBeNull();

      expect(await repository.deleteCommunityPost(identity.id, post.id)).toBe(true);
    });

    it('stores one report per user for a community post', async () => {
      await repository.ensureUser(identity);
      const card = await repository.createCapturedCard({
        userId: identity.id, itemName: 'Palm Squirrel', category: 'Fauna', cardTitle: 'Palm Squirrel',
        rarityTier: 'D', rarityScore: 0.6, rarityStars: 3, description: '', status: 'final',
      });
      const { post } = await repository.createCommunityPost({ userId: identity.id, cardId: card.id });

      const first = await repository.reportCommunityPost(identity.id, post.id, { reason: 'unsafe_location', details: 'Too exact.' });
      const second = await repository.reportCommunityPost(identity.id, post.id, { reason: 'unsafe_location' });

      expect(first.created).toBe(true);
      expect(second.created).toBe(false);
      expect((await pool.query('SELECT COUNT(*)::int AS count FROM community_post_reports')).rows[0].count).toBe(1);
    });
  });

  describe('account deletion requests', () => {
    it('records one pending deletion request per user', async () => {
      await repository.ensureUser(identity);
      const first = await repository.requestAccountDeletion(identity.id, { reason: 'Leaving.' });
      const second = await repository.requestAccountDeletion(identity.id, {});

      expect(first.created).toBe(true);
      expect(second.created).toBe(false);
      expect(second.id).toBe(first.id);
      const user = await pool.query('SELECT account_status FROM quest_users WHERE id = $1', [identity.id]);
      expect(user.rows[0].account_status).toBe('deletion_requested');
    });
  });

  describe('demo community seed', () => {
    it('seeds six demo users with shareable posts and is idempotent', async () => {
      await repository.ensureUser(identity);
      await repository.seedDemoSocial(identity.id);

      const friends = await repository.listFriends(identity.id);
      expect(friends).toHaveLength(6);

      const posts = await repository.listCommunityPosts(identity.id);
      expect(posts.length).toBeGreaterThanOrEqual(8);
      expect(posts.every((post) => Number(post.discovery.rarityStars) > 1)).toBe(true);

      const authorProfile = await repository.getCommunityProfile(identity.id, '10000000-0000-4000-8000-000000000104');
      expect(authorProfile).not.toBeNull();
      expect(authorProfile.stats.posts).toBe(2);
      expect(authorProfile.viewer.isFriend).toBe(true);

      // A second call must not duplicate users, posts, or friendships.
      await repository.seedDemoSocial(identity.id);
      expect(await repository.listFriends(identity.id)).toHaveLength(6);
      expect((await pool.query('SELECT COUNT(*)::int AS count FROM quest_users WHERE id LIKE \'10000000-%\'')).rows[0].count).toBe(6);
      expect((await pool.query('SELECT COUNT(*)::int AS count FROM community_posts')).rows[0].count).toBe(8);
    });
  });
});
