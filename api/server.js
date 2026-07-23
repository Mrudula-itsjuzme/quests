import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { loadConfig } from './config.js';
import { createAuthMiddleware } from './auth.js';
import { QuestEngine } from './lib/quest-engine.js';
import { questDefinitions } from './lib/quest-definitions.js';
import { createProviders, ProviderNotConfiguredError } from './lib/providers.js';
import { MemoryQuestRepository } from './lib/memory-repository.js';
import { PostgresQuestRepository } from './lib/postgres-repository.js';

const idempotencySchema = z.string().min(8).max(160).regex(/^[A-Za-z0-9._:-]+$/);
const assignmentIdSchema = z.string().uuid();
const progressSchema = z.object({ value: z.coerce.number().finite().min(0).max(10_000_000) }).strict();
const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  timezone: z.string().min(1).max(80).refine((value) => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }, 'must be an IANA timezone').optional(),
  primaryPath: z.enum(['Mind', 'Body', 'Discovery']).nullable().optional(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  motionPreference: z.enum(['system', 'full', 'reduced']).optional(),
  onboardingCompleted: z.boolean().optional(),
  tourVersionSeen: z.coerce.number().int().min(0).max(1000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'profile update cannot be empty');
const submissionSchema = z.object({ text: z.string().max(10_000).optional(), uploadId: z.string().max(100).optional(), feedOptIn: z.boolean().optional() }).strict();
const legacyQuestSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(2000).optional(),
  detail: z.string().trim().max(4000).optional(),
  category: z.enum(['Mind', 'Body', 'Discovery']).default('Discovery'),
  rarity: z.enum(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']).default('Common'),
  xp: z.coerce.number().int().min(0).max(500).default(25),
  instructions: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
}).passthrough();

export function createApp(options = {}) {
  const config = options.config || loadConfig();
  const repository = options.repository || new MemoryQuestRepository({ definitions: questDefinitions });
  const providers = options.providers || createProviders({ mode: config.PROVIDER_MODE });
  const engine = options.engine || new QuestEngine({ repository, providers });
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY);
  app.use((req, res, next) => {
    req.id = safeRequestId(req.get('x-request-id'));
    res.setHeader('x-request-id', req.id);
    res.setTimeout(10_000, () => { if (!res.headersSent) res.status(503).json({ error: { code: 'request_timeout', requestId: req.id } }); });
    next();
  });
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'connect-src': ["'self'", ...(config.SUPABASE_URL ? [config.SUPABASE_URL] : [])],
      },
    },
  }));
  const corsMiddleware = cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('cors_origin_denied'));
    },
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key', 'X-Request-ID'],
  });
  app.use('/api', corsMiddleware);
  app.use(express.json({ limit: config.REQUEST_BODY_LIMIT, strict: true }));

  const rateKey = (req) => req.identity?.id || ipKeyGenerator(req.ip);
  const authLimiter = rateLimit({ windowMs: config.RATE_LIMIT_WINDOW_MS, limit: config.RATE_LIMIT_AUTH, standardHeaders: 'draft-7', legacyHeaders: false, keyGenerator: rateKey });
  const readLimiter = rateLimit({ windowMs: config.RATE_LIMIT_WINDOW_MS, limit: config.RATE_LIMIT_READS, standardHeaders: 'draft-7', legacyHeaders: false, keyGenerator: rateKey });
  const writeLimiter = rateLimit({ windowMs: config.RATE_LIMIT_WINDOW_MS, limit: config.RATE_LIMIT_WRITES, standardHeaders: 'draft-7', legacyHeaders: false, keyGenerator: rateKey });
  const authenticate = createAuthMiddleware(config, { jwks: options.authJwks });

  app.get('/health', (_req, res) => res.json({ status: 'ok', database: options.pool ? 'configured' : 'memory-fallback' }));
  app.get('/ready', async (_req, res) => {
    try {
      if (options.pool) await options.pool.query('SELECT 1');
      return res.json({ status: 'ready', database: options.pool ? 'postgres' : 'memory' });
    } catch {
      return res.status(503).json({ status: 'not_ready' });
    }
  });

  app.use('/api', authLimiter);
  app.use('/api', authenticate);
  app.use('/api', readLimiter);
  app.get('/api/v1/me', asyncRoute(async (req, res) => res.json(await engine.getMe(req.identity))));
  app.patch('/api/v1/me', writeLimiter, asyncRoute(async (req, res) => res.json(await engine.updateMe(req.identity, parse(profileSchema, req.body)))));
  app.get('/api/v1/quests/definitions', asyncRoute(async (req, res) => res.json(await engine.definitions(req.identity, {
    cadence: optionalEnum(req.query.cadence, ['daily', 'weekly']),
    category: optionalEnum(req.query.category, ['Mind', 'Body', 'Discovery', 'Weekly']),
  }))));
  app.get('/api/v1/quests/active', asyncRoute(async (req, res) => res.json(await engine.active(req.identity))));
  app.get('/api/v1/quests/history', asyncRoute(async (req, res) => res.json(await engine.history(req.identity))));
  app.post('/api/v1/quests/generate-daily', writeLimiter, asyncRoute(async (req, res) => res.status(201).json(await engine.generateDaily(req.identity, requireIdempotency(req)))));
  app.post('/api/v1/quests/generate-weekly', writeLimiter, asyncRoute(async (req, res) => res.status(201).json(await engine.generateWeekly(req.identity, requireIdempotency(req)))));
  app.post('/api/v1/quests/:assignmentId/progress', writeLimiter, asyncRoute(async (req, res) => res.json(await engine.progress(req.identity, parse(assignmentIdSchema, req.params.assignmentId), parse(progressSchema, req.body), requireIdempotency(req)))));
  app.post('/api/v1/quests/:assignmentId/submissions', writeLimiter, asyncRoute(async (req, res) => res.status(201).json(await engine.submit(req.identity, parse(assignmentIdSchema, req.params.assignmentId), parse(submissionSchema, req.body), requireIdempotency(req)))));
  app.get('/api/v1/collectibles', asyncRoute(async (req, res) => res.json(await repository.getCollectibles(req.identity.id))));

  app.get('/api/quests', asyncRoute(async (req, res) => {
    let active = await engine.active(req.identity);
    const dateKey = new Date().toISOString().slice(0, 10);
    if (!active.some((item) => item.cadence === 'daily')) await engine.generateDaily(req.identity, `legacy-daily-${dateKey}`);
    if (!active.some((item) => item.cadence === 'weekly')) await engine.generateWeekly(req.identity, `legacy-weekly-${dateKey}`);
    active = await engine.active(req.identity);
    res.json(active.map(mapLegacyQuest));
  }));
  app.get('/api/collectibles', asyncRoute(async (req, res) => res.json(await repository.getCollectibles(req.identity.id))));
  app.post('/api/quests', writeLimiter, asyncRoute(async (req, res) => {
    requireLegacyDevelopment(config);
    const assignment = await engine.createLegacyQuest(req.identity, parse(legacyQuestSchema, req.body));
    res.status(201).json(mapLegacyQuest(assignment));
  }));
  app.post('/api/quests/:id/complete', writeLimiter, asyncRoute(async (req, res) => {
    requireLegacyDevelopment(config);
    const result = await engine.completeLegacy(req.identity, req.params.id);
    res.json({ quest: mapLegacyQuest(result.assignment), collectible: null, xpCredited: result.xpCredited, bonusXp: result.bonusXp });
  }));

  const distPath = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath, { index: false, fallthrough: true, maxAge: config.NODE_ENV === 'production' ? '1h' : 0 }));
    app.get('*', (_req, res) => res.sendFile(resolve(distPath, 'index.html')));
  }

  app.use((error, req, res, _next) => {
    const status = Number(error.status) || (error instanceof z.ZodError ? 400 : error instanceof ProviderNotConfiguredError ? 503 : error.message === 'cors_origin_denied' ? 403 : 500);
    const parserCode = error.type === 'entity.too.large' ? 'payload_too_large' : error.type === 'entity.parse.failed' ? 'invalid_json' : null;
    const code = parserCode
      || (error instanceof z.ZodError ? 'invalid_request'
        : error instanceof ProviderNotConfiguredError ? 'provider_not_configured'
          : status >= 500 ? 'internal_error'
            : error.code || error.message);
    if (status >= 500) console.error(JSON.stringify({ level: 'error', event: 'request_failed', requestId: req.id, method: req.method, path: req.path, code }));
    res.status(status).json({ error: { code, requestId: req.id } });
  });
  return app;
}

export async function createRuntime(env = process.env) {
  const config = loadConfig(env);
  let pool;
  let repository;
  if (config.databaseUrl) {
    pool = new Pool({ connectionString: config.databaseUrl, ssl: config.DATABASE_SSL ? { rejectUnauthorized: true } : false, max: 10, connectionTimeoutMillis: 5_000, idleTimeoutMillis: 30_000, statement_timeout: config.DATABASE_STATEMENT_TIMEOUT_MS, query_timeout: config.DATABASE_STATEMENT_TIMEOUT_MS + 1_000 });
    repository = new PostgresQuestRepository(pool);
  } else {
    repository = new MemoryQuestRepository({ definitions: questDefinitions });
  }
  const providers = createProviders({ mode: config.PROVIDER_MODE });
  return { config, pool, repository, providers, engine: new QuestEngine({ repository, providers }) };
}

export async function startServer(env = process.env) {
  const runtime = await createRuntime(env);
  const app = createApp(runtime);
  const server = app.listen(runtime.config.PORT, runtime.config.listenHost, () => console.log(`Quest API listening on ${runtime.config.listenHost}:${runtime.config.PORT}`));
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxRequestsPerSocket = 1_000;
  const shutdown = async () => {
    server.close(async () => { await runtime.pool?.end(); process.exit(0); });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return server;
}

function parse(schema, value) { return schema.parse(value); }
function requireIdempotency(req) {
  const result = idempotencySchema.safeParse(req.get('idempotency-key'));
  if (!result.success) { const error = new Error('idempotency_key_required'); error.code = 'idempotency_key_required'; error.status = 400; throw error; }
  return result.data;
}
function requireLegacyDevelopment(config) { if (config.NODE_ENV === 'production' || !config.DEV_ALLOW_LEGACY_MUTATIONS) { const error = new Error('legacy_mutation_disabled'); error.code = 'legacy_mutation_disabled'; error.status = 403; throw error; } }
function optionalEnum(value, allowed) { if (value == null || value === '') return undefined; if (!allowed.includes(value)) { const error = new Error('invalid_filter'); error.code = 'invalid_filter'; error.status = 400; throw error; } return value; }
function safeRequestId(value) { return typeof value === 'string' && /^[A-Za-z0-9._:-]{8,100}$/.test(value) ? value : randomUUID(); }
function asyncRoute(handler) { return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next); }
function mapLegacyQuest(item) { return { id: item.id, title: item.title, summary: item.description, detail: item.description, category: item.category === 'Weekly' ? 'Discovery' : item.category, rarity: item.rarity, xp: item.xpReward, status: legacyStatus(item.status), progress: item.targetValue ? item.progressValue / item.targetValue : 0, target: `${item.progressValue}/${item.targetValue} ${item.unit}`, instructions: item.instructions, proofType: item.verificationType.toLowerCase(), cadence: item.cadence }; }
function legacyStatus(status) { return status === 'completed' ? 'Completed' : status === 'pending_verification' ? 'Awaiting Proof' : status === 'active' || status === 'rejected' ? 'In Progress' : 'Not Started'; }

// --- Vercel Serverless Entry Point ---
// Vercel imports this file and calls the default export as a request handler.
// We lazily initialise the runtime once per cold start.
let _vercelApp;
async function getVercelApp() {
  if (!_vercelApp) {
    const runtime = await createRuntime();
    _vercelApp = createApp(runtime);
  }
  return _vercelApp;
}
export default async function handler(req, res) {
  const app = await getVercelApp();
  return app(req, res);
}

// --- Self-hosted Entry Point ---
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) startServer();
