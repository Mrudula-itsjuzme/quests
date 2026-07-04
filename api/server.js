import express from 'express';
import { Pool } from 'pg';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const DEFAULT_QUESTS = [
  {
    id: 'daily-focus',
    title: 'Morning Mindfulness',
    summary: 'Complete a 10-minute breathing ritual and capture the feeling.',
    detail: 'Sit somewhere calm, breathe slowly, and note one intention for the day.',
    category: 'Mind',
    rarity: 'Rare',
    xp: 120,
    status: 'In Progress',
    progress: 0.7,
    target: '7/10 days',
    instructions: ['Set a quiet timer', 'Breathe for 10 minutes', 'Write one line of gratitude'],
    proofType: 'photo',
    cadence: 'daily',
  },
  {
    id: 'body-reset',
    title: 'Body Reset',
    summary: 'Take a brisk walk and log how your energy feels after.',
    detail: 'A short walk can reset your nervous system and improve your mood.',
    category: 'Body',
    rarity: 'Uncommon',
    xp: 90,
    status: 'Awaiting Proof',
    progress: 1,
    target: '1/1 proof',
    instructions: ['Walk for 15 minutes', 'Hydrate after', 'Upload a photo from your route'],
    proofType: 'photo',
    cadence: 'daily',
  },
  {
    id: 'discovery',
    title: 'Weekly Discovery',
    summary: 'Explore one new habit or experience and share a reflection.',
    detail: 'Try something slightly unfamiliar and log what it taught you.',
    category: 'Discovery',
    rarity: 'Epic',
    xp: 180,
    status: 'Not Started',
    progress: 0.2,
    target: '3/5 prompts',
    instructions: ['Choose a new experience', 'Spend 20 minutes with it', 'Reflect in one sentence'],
    proofType: 'auto',
    cadence: 'weekly',
  },
];

const DEFAULT_COLLECTIBLES = [
  {
    assetId: 'wisp-focus',
    questId: 'daily-focus',
    title: 'Focus Wisp',
    category: 'Mind',
    rarity: 'Rare',
    caption: 'Unlocked for completing a mindful streak ritual.',
  },
  {
    assetId: 'pulse-sprint',
    questId: 'body-reset',
    title: 'Pulse Sprint',
    category: 'Body',
    rarity: 'Uncommon',
    caption: 'Unlocked for proving movement and recovery.',
  },
  {
    assetId: 'orbit-signal',
    questId: 'discovery',
    title: 'Orbit Signal',
    category: 'Discovery',
    rarity: 'Epic',
    caption: 'Unlocked for exploring a new habit path.',
  },
];

let pool;
if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  });
}

const VALID_CATEGORIES = new Set(['Mind', 'Body', 'Discovery']);
const VALID_RARITIES = new Set(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);
const VALID_STATUSES = new Set(['Not Started', 'In Progress', 'Awaiting Proof', 'Completed']);

function clampProgress(progress) {
  const parsed = Number(progress);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(1, parsed));
}

function normalizeQuest(payload = {}) {
  const title = String(payload.title || '').trim();
  const category = VALID_CATEGORIES.has(payload.category) ? payload.category : 'Discovery';
  const rarity = VALID_RARITIES.has(payload.rarity) ? payload.rarity : 'Common';
  const status = VALID_STATUSES.has(payload.status) ? payload.status : 'Not Started';
  const xp = Number.parseInt(payload.xp, 10);
  const instructions = Array.isArray(payload.instructions)
    ? payload.instructions.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
    : [];

  if (!title) {
    return { error: 'Quest title is required' };
  }

  return {
    id: String(payload.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).slice(0, 80),
    title,
    summary: String(payload.summary || 'A custom quest created from the quest console.').trim(),
    detail: String(payload.detail || payload.summary || 'Complete the quest and claim your reward.').trim(),
    category,
    rarity,
    xp: Number.isFinite(xp) ? Math.max(10, Math.min(500, xp)) : 80,
    status,
    progress: clampProgress(payload.progress),
    target: String(payload.target || '0/1 steps').trim(),
    instructions: instructions.length > 0 ? instructions : ['Start the quest', 'Complete the proof step', 'Claim the reward'],
    proofType: String(payload.proofType || 'auto').trim(),
    cadence: String(payload.cadence || 'daily').trim(),
  };
}

function mapQuestRow(quest) {
  return {
    ...quest,
    instructions: quest.instructions || [],
    progress: Number(quest.progress),
  };
}

function getCollectibleForQuest(quest) {
  return (
    DEFAULT_COLLECTIBLES.find((item) => item.questId === quest.id) || {
      assetId: `${quest.id}-relic`,
      questId: quest.id,
      title: `${quest.category} Relic`,
      category: quest.category,
      rarity: quest.rarity,
      caption: `Unlocked by completing ${quest.title}.`,
    }
  );
}

function mapCollectibleRow(row) {
  return {
    assetId: row.asset_id,
    questId: row.quest_id,
    title: row.title,
    category: row.category,
    rarity: row.rarity,
    caption: row.caption,
    unlockedAt: row.unlocked_at,
  };
}

export async function initializeDatabase() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      detail TEXT NOT NULL,
      category TEXT NOT NULL,
      rarity TEXT NOT NULL,
      xp INTEGER NOT NULL,
      status TEXT NOT NULL,
      progress REAL NOT NULL,
      target TEXT NOT NULL,
      instructions TEXT[] NOT NULL,
      proof_type TEXT NOT NULL,
      cadence TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quest_events (
      id BIGSERIAL PRIMARY KEY,
      quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      xp_awarded INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS collectible_unlocks (
      account_key TEXT NOT NULL DEFAULT 'local-player',
      asset_id TEXT NOT NULL,
      quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      rarity TEXT NOT NULL,
      caption TEXT NOT NULL,
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (account_key, asset_id)
    );
  `);

  const { rowCount } = await pool.query('SELECT 1 FROM quests LIMIT 1');
  if (rowCount === 0) {
    await Promise.all(
      DEFAULT_QUESTS.map((quest) =>
        pool.query(
          `INSERT INTO quests (id, title, summary, detail, category, rarity, xp, status, progress, target, instructions, proof_type, cadence)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            quest.id,
            quest.title,
            quest.summary,
            quest.detail,
            quest.category,
            quest.rarity,
            quest.xp,
            quest.status,
            quest.progress,
            quest.target,
            quest.instructions,
            quest.proofType,
            quest.cadence,
          ],
        ),
      ),
    );
  }
}

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', database: pool ? 'configured' : 'memory-fallback' });
  });

  app.get('/api/quests', async (_req, res) => {
    if (!pool) {
      return res.json(DEFAULT_QUESTS);
    }

    try {
      const { rows } = await pool.query(`
        SELECT id, title, summary, detail, category, rarity, xp, status, progress, target, instructions, proof_type as "proofType", cadence
        FROM quests
        ORDER BY id;
      `);
      return res.json(rows.map(mapQuestRow));
    } catch (error) {
      console.error('Quest query failed', error);
      return res.json(DEFAULT_QUESTS);
    }
  });

  app.get('/api/collectibles', async (req, res) => {
    if (!pool) {
      return res.json([]);
    }

    try {
      const accountKey = String(req.query.account || 'local-player').slice(0, 80);
      const { rows } = await pool.query(
        `SELECT asset_id, quest_id, title, category, rarity, caption, unlocked_at
         FROM collectible_unlocks
         WHERE account_key = $1
         ORDER BY unlocked_at DESC`,
        [accountKey],
      );
      return res.json(rows.map(mapCollectibleRow));
    } catch (error) {
      console.error('Collectible query failed', error);
      return res.status(500).json({ error: 'Failed to load collectibles' });
    }
  });

  app.post('/api/quests', async (req, res) => {
    const quest = normalizeQuest(req.body);
    if (quest.error) {
      return res.status(400).json({ error: quest.error });
    }

    if (!pool) {
      return res.status(503).json({ error: 'Database is not configured. Start with docker compose to persist quests.' });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO quests (id, title, summary, detail, category, rarity, xp, status, progress, target, instructions, proof_type, cadence)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           summary = EXCLUDED.summary,
           detail = EXCLUDED.detail,
           category = EXCLUDED.category,
           rarity = EXCLUDED.rarity,
           xp = EXCLUDED.xp,
           status = EXCLUDED.status,
           progress = EXCLUDED.progress,
           target = EXCLUDED.target,
           instructions = EXCLUDED.instructions,
           proof_type = EXCLUDED.proof_type,
           cadence = EXCLUDED.cadence
         RETURNING id, title, summary, detail, category, rarity, xp, status, progress, target, instructions, proof_type as "proofType", cadence`,
        [
          quest.id,
          quest.title,
          quest.summary,
          quest.detail,
          quest.category,
          quest.rarity,
          quest.xp,
          quest.status,
          quest.progress,
          quest.target,
          quest.instructions,
          quest.proofType,
          quest.cadence,
        ],
      );
      return res.status(201).json(mapQuestRow(rows[0]));
    } catch (error) {
      console.error('Quest insert failed', error);
      return res.status(500).json({ error: 'Failed to save quest' });
    }
  });

  app.post('/api/quests/:id/complete', async (req, res) => {
    const accountKey = String(req.body?.accountKey || req.query.account || 'local-player').slice(0, 80);
    if (!pool) {
      const fallbackQuest = DEFAULT_QUESTS.find((quest) => quest.id === req.params.id);
      if (!fallbackQuest) {
        return res.status(404).json({ error: 'Quest not found' });
      }
      const quest = { ...fallbackQuest, status: 'Completed', progress: 1 };
      return res.json({ quest, collectible: { ...getCollectibleForQuest(quest), unlockedAt: new Date().toISOString() } });
    }

    try {
      const { rows } = await pool.query(
        `UPDATE quests
         SET status = 'Completed', progress = 1
         WHERE id = $1
         RETURNING id, title, summary, detail, category, rarity, xp, status, progress, target, instructions, proof_type as "proofType", cadence`,
        [req.params.id],
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Quest not found' });
      }

      await pool.query('INSERT INTO quest_events (quest_id, event_type, xp_awarded) VALUES ($1, $2, $3)', [
        req.params.id,
        'completed',
        rows[0].xp,
      ]);

      const quest = mapQuestRow(rows[0]);
      const collectible = getCollectibleForQuest(quest);
      const unlock = await pool.query(
        `INSERT INTO collectible_unlocks (account_key, asset_id, quest_id, title, category, rarity, caption)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (account_key, asset_id) DO UPDATE SET unlocked_at = collectible_unlocks.unlocked_at
         RETURNING asset_id, quest_id, title, category, rarity, caption, unlocked_at`,
        [
          accountKey,
          collectible.assetId,
          quest.id,
          collectible.title,
          collectible.category,
          collectible.rarity,
          collectible.caption,
        ],
      );

      return res.json({ quest, collectible: mapCollectibleRow(unlock.rows[0]) });
    } catch (error) {
      console.error('Quest completion failed', error);
      return res.status(500).json({ error: 'Failed to complete quest' });
    }
  });

  const distPath = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(resolve(distPath, 'index.html'));
    });
  }

  return app;
}

export async function startServer(port = Number(process.env.PORT || 3001)) {
  await initializeDatabase();
  const app = createApp();
  return app.listen(port, '0.0.0.0', () => {
    console.log(`Quest API listening on port ${port}`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
