import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { Pool } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
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
import { resolveVisionProvider, resolveCandidateSpecies, VisionClassificationError } from './lib/vision-providers.js';
import { antiCheatVerdict, GateVerdict } from './lib/anti-cheat.js';
import { scoreDiscovery, DEFAULT_WEIGHTS, DEFAULT_GRADE_BANDS } from './lib/rarity-engine.js';
import { speciesCatalog } from './lib/species-catalog.js';
import { protectedGps } from './lib/geo-privacy.js';
import { redactPublicPayload } from './lib/public-redaction.js';
import { auditLog } from './lib/audit-log.js';
import clientMetrics from 'prom-client';

const PUBLIC_SPECIES_CATALOG = speciesCatalog
  .filter((entry) => entry.enabled)
  .map(({ id, commonName, scientificName, element, category, baseRarity, nocturnal, sensitive, seasonalityMonths, encyclopedia }) => ({
    id, commonName, scientificName, element, category, baseRarity, nocturnal, sensitive, seasonalityMonths, encyclopedia,
  }));

const SPECIES_BY_ID = new Map(speciesCatalog.map((entry) => [entry.id, entry]));

const CONFIDENCE_THRESHOLD = 0.70;

const idempotencySchema = z.string().min(8).max(160).regex(/^[A-Za-z0-9._:-]+$/);
const assignmentIdSchema = z.string().uuid();
const notificationIdSchema = z.string().uuid();
const submissionIdSchema = z.string().uuid();
const reviewSchema = z.object({ decision: z.enum(['approve', 'reject']), reason: z.string().trim().max(1000).optional() }).strict();
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
const captureIdSchema = z.string().uuid();
const gpsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).max(100_000).nullable().optional(),
  altitude: z.number().nullable().optional(),
  gpsFixMs: z.number().min(0).max(120_000).nullable().optional(),
}).strict().nullable().optional();
const livenessSchema = z.object({
  attested: z.boolean(),
  method: z.string().max(80).optional(),
  score: z.number().min(0).max(1).optional(),
}).strict().nullable().optional();
const exifSchema = z.object({
  make: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  lens: z.string().nullable().optional(),
  exposure: z.string().nullable().optional(),
  iso: z.number().nullable().optional(),
  orientation: z.number().nullable().optional(),
  hasExif: z.boolean().optional(),
}).strict().nullable().optional();
const captureCreateSchema = z.object({
  captureId: z.string().uuid().optional(),
  imageBase64: z.string().min(100).max(8_000_000).regex(/^data:image\/(png|jpe?g|webp);base64,/, 'must be a base64 data URL'),
  capturedAt: z.string().datetime().optional(),
  gps: gpsSchema,
  exif: exifSchema,
  heading: z.number().min(0).max(360).nullable().optional(),
  liveness: livenessSchema,
  chosenCandidateIndex: z.number().int().min(0).max(2).optional(),
}).strict();
const captureRenameSchema = z.object({
  cardTitle: z.string().trim().min(1).max(80).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'capture update cannot be empty');
const postIdSchema = z.string().uuid();
const hotspotCategorySchema = z.enum(['Hotspots', 'Parks', 'Waterfalls', 'Birding']);
// "minLng,minLat,maxLng,maxLat" — the GeoJSON/slippy-map ordering, so the
// parser is the single place that decides which number is which axis.
const bboxSchema = z.string().regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/).transform((value, ctx) => {
  const [minLng, minLat, maxLng, maxLat] = value.split(',').map(Number);
  if (minLat < -90 || maxLat > 90 || minLat > maxLat || minLng < -180 || maxLng > 180 || minLng > maxLng) {
    ctx.addIssue({ code: 'custom', message: 'invalid bbox' });
    return z.NEVER;
  }
  return { minLat, maxLat, minLng, maxLng };
});
const communityPostSchema = z.object({
  cardId: z.string().uuid(),
  caption: z.string().trim().max(500).optional(),
  hashtags: z.array(z.string().trim().min(1).max(40).regex(/^#?[\p{L}\p{N}_]+$/u, 'invalid hashtag')).max(8).optional(),
  placeLabel: z.string().trim().max(120).optional(),
  visibility: z.enum(['public', 'friends']).optional(),
}).strict();
const communityLikeSchema = z.object({ liked: z.boolean() }).strict();
const communityCommentSchema = z.object({ body: z.string().trim().min(1).max(1000) }).strict();
const communityReportSchema = z.object({ reason: z.enum(['abuse', 'misinfo', 'private_info', 'unsafe_location', 'spam', 'other']), details: z.string().trim().max(1000).optional() }).strict();
const communityScopeSchema = z.enum(['public', 'friends']);
const deleteAccountSchema = z.object({ reason: z.string().trim().max(1000).optional() }).strict().optional();
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
  const providers = options.providers || createProviders({ mode: config.PROVIDER_MODE, aiVerifyUrl: config.QUEST_AI_VERIFY_URL, providerSecret: config.QUEST_PROVIDER_SECRET, notificationUrl: config.QUEST_NOTIFICATION_URL });
  const engine = options.engine || new QuestEngine({ repository, providers });
  const visionProvider = options.visionProvider || resolveVisionProvider(config);
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY);
  app.use((req, res, next) => {
    const startTime = process.hrtime.bigint();
    req.id = safeRequestId(req.get('x-request-id'));
    res.setHeader('x-request-id', req.id);
    res.setHeader('Cache-Control', 'no-store');
    const originalJson = res.json;
    res.json = function (body) {
      const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
      if (!res.headersSent) res.setHeader('Server-Timing', `total;dur=${durationMs.toFixed(2)}`);
      return originalJson.call(this, body);
    };
    res.setTimeout(10_000, () => { if (!res.headersSent) res.status(503).json({ error: { code: 'request_timeout', requestId: req.id } }); });
    next();
  });
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'https://*.supabase.co'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        workerSrc: ["'self'", 'blob:'],
      },
    },
  }));
  const corsMiddleware = cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      // Allow same-origin requests (frontend served from this same server)
      if (config.selfOrigin && origin === config.selfOrigin) return callback(null, true);
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

  app.get('/health', (req, res) => res.json({ status: 'ok', database: options.pool ? 'configured' : 'memory-fallback', requestId: req.id }));
  app.get('/ready', async (_req, res) => {
    try {
      if (options.pool) await options.pool.query('SELECT 1');
      return res.json({ status: 'ready', database: options.pool ? 'postgres' : 'memory', providerMode: config.PROVIDER_MODE });
    } catch {
      return res.status(503).json({ status: 'not_ready' });
    }
  });

  app.post('/api/internal/scheduler', writeLimiter, asyncRoute(async (req, res) => {
    if (!config.CRON_SECRET || req.get('authorization') !== `Bearer ${config.CRON_SECRET}`) return res.status(401).json({ error: { code: 'invalid_cron_secret', requestId: req.id } });
    return res.json(await engine.runScheduler());
  }));
  app.get('/api/internal/scheduler', writeLimiter, asyncRoute(async (req, res) => {
    if (!config.CRON_SECRET || req.get('authorization') !== `Bearer ${config.CRON_SECRET}`) return res.status(401).json({ error: { code: 'invalid_cron_secret', requestId: req.id } });
    return res.json(await engine.runScheduler());
  }));

  app.use('/api', authLimiter);
  app.use('/api', authenticate);
  app.use('/api', readLimiter);
  // Prometheus metrics (disabled in test by default)
  if (config.NODE_ENV !== 'test') {
    const collectDefaultMetrics = clientMetrics.collectDefaultMetrics;
    collectDefaultMetrics({ timeout: 5000 });
    app.get('/metrics', async (_req, res) => {
      try {
        res.set('Content-Type', clientMetrics.register.contentType);
        res.end(await clientMetrics.register.metrics());
      } catch (err) {
        res.status(500).end(err.message);
      }
    });
  }
  app.get('/api/v1/me', asyncRoute(async (req, res) => res.json(await engine.getMe(req.identity))));
  app.patch('/api/v1/me', writeLimiter, asyncRoute(async (req, res) => res.json(await engine.updateMe(req.identity, parse(profileSchema, req.body)))));
  app.get('/api/v1/quests/definitions', asyncRoute(async (req, res) => sendCachedJson(req, res, await engine.definitions(req.identity, {
    cadence: optionalEnum(req.query.cadence, ['daily', 'weekly', 'monthly']),
    category: optionalEnum(req.query.category, ['Mind', 'Body', 'Discovery', 'Weekly', 'Monthly']),
  }))));

  app.get('/api/v1/quests/active', asyncRoute(async (req, res) => res.json(await engine.active(req.identity))));
  app.get('/api/v1/quests/history', asyncRoute(async (req, res) => res.json(await engine.history(req.identity))));
  app.post('/api/v1/quests/generate-daily', writeLimiter, asyncRoute(async (req, res) => res.status(201).json(await engine.generateDaily(req.identity, requireIdempotency(req)))));
  app.post('/api/v1/quests/generate-weekly', writeLimiter, asyncRoute(async (req, res) => res.status(201).json(await engine.generateWeekly(req.identity, requireIdempotency(req)))));
  app.post('/api/v1/quests/generate-monthly', writeLimiter, asyncRoute(async (req, res) => res.status(201).json(await engine.generateMonthly(req.identity, requireIdempotency(req)))));
  app.post('/api/v1/quests/:assignmentId/progress', writeLimiter, asyncRoute(async (req, res) => res.json(await engine.progress(req.identity, parse(assignmentIdSchema, req.params.assignmentId), parse(progressSchema, req.body), requireIdempotency(req)))));
  app.post('/api/v1/quests/:assignmentId/submissions', writeLimiter, asyncRoute(async (req, res) => res.status(201).json(await engine.submit(req.identity, parse(assignmentIdSchema, req.params.assignmentId), parse(submissionSchema, req.body), requireIdempotency(req)))));
  app.get('/api/v1/collectibles', asyncRoute(async (req, res) => sendCachedJson(req, res, await repository.getCollectibles(req.identity.id))));
  app.get('/api/v1/species', asyncRoute(async (req, res) => sendCachedJson(req, res, PUBLIC_SPECIES_CATALOG)));
  app.post('/api/v1/captures', writeLimiter, asyncRoute(async (req, res) => {
    const body = parse(captureCreateSchema, req.body);
    const idempotencyKey = requireIdempotency(req);
    const serverReceivedAt = new Date();
    const imageHash = createHash('sha256').update(body.imageBase64).digest('hex');
    const mediaContentType = parseImageDataUrl(body.imageBase64).contentType;
    const capturedAt = body.capturedAt || serverReceivedAt.toISOString();

    const gate = await antiCheatVerdict(
      { capturedAt, gps: body.gps || null, heading: body.heading ?? null, liveness: body.liveness || null, exif: body.exif || null, imageHash },
      { repository, userId: req.identity.id, serverReceivedAt },
    );
    if (gate.unimplementedDetectors.length && config.NODE_ENV !== 'test') auditLog('anti_cheat_unimplemented_detectors', { level: 'warn', requestId: req.id, detectors: gate.unimplementedDetectors });
    if (config.NODE_ENV !== 'test') auditLog('capture_anti_cheat_verdict', { requestId: req.id, userId: req.identity.id, verdict: gate.verdict, reason: gate.reason, gps: body.gps || null });

    if (gate.verdict === GateVerdict.REJECT) {
      return res.status(422).json({ error: { code: 'anti_cheat_rejected', reason: gate.reason, requestId: req.id } });
    }

    const result = await repository.runIdempotent(req.identity.id, 'create-capture', idempotencyKey, async () => {
      const existingCapture = body.captureId ? await repository.getCapturedCardByCaptureId?.(req.identity.id, body.captureId) : null;
      if (existingCapture) return { card: existingCapture };
      const identification = await visionProvider.identify(body.imageBase64);
      const top = identification.candidates[body.chosenCandidateIndex ?? 0] || identification.candidates[0];

      if (body.chosenCandidateIndex == null && top.confidence < CONFIDENCE_THRESHOLD) {
        return { needsConfirmation: true, candidates: identification.candidates };
      }

      const speciesMatch = resolveCandidateSpecies(top);
      const lastCapture = await repository.getLastCaptureLocation?.(req.identity.id);
      const isFirstForPlayer = speciesMatch.id
        ? !(await repository.hasCapturedSpecies?.(req.identity.id, speciesMatch.id))
        : false;
      const isFirstGlobal = speciesMatch.id
        ? !(await repository.hasAnyCaptureOfSpecies?.(speciesMatch.id))
        : false;
      const discoveryStats = speciesMatch.id ? await repository.getSpeciesDiscoveryStats?.(speciesMatch.id) : null;

      const rarity = scoreDiscovery(
        {
          species: speciesMatch,
          confidence: top.confidence,
          capturedAt,
          gps: body.gps || null,
          lastCaptureGps: lastCapture?.gps || null,
          isFirstForPlayer,
          isFirstGlobal,
          discoveryStats,
        },
        { version: 1, weights: DEFAULT_WEIGHTS, gradeBands: DEFAULT_GRADE_BANDS },
      );

      const card = await repository.createCapturedCard({
        userId: req.identity.id,
        captureId: body.captureId || null,
        speciesId: speciesMatch.id,
        itemName: speciesMatch.commonName,
        category: speciesMatch.category,
        cardTitle: speciesMatch.commonName,
        rarityTier: rarity.grade,
        rarityScore: rarity.score / 100,
        description: speciesMatch.encyclopedia || top.ecosystem || '',
        mediaData: body.imageBase64,
        mediaContentType,
        imageHash,
        status: gate.verdict === GateVerdict.PASS_WITH_REVIEW || rarity.humanReview ? 'provisional' : 'final',
        gps: protectedGps(body.gps || null, speciesMatch),
        heading: body.heading ?? null,
        capturedAt,
        serverReceivedAt,
        antiCheatVerdict: gate.verdict,
        antiCheatReason: gate.reason,
        antiCheatDetail: gate.results,
        confidence: top.confidence,
        rarityGrade: rarity.grade,
        rarityStars: rarity.stars,
        rarityWeightSetVersion: rarity.weightSetVersion,
        rarityFactorBreakdown: rarity.factorBreakdown,
        xpAwarded: rarity.xp,
        coinsAwarded: rarity.coins,
      });
      if (config.NODE_ENV !== 'test') auditLog('capture_minted', { requestId: req.id, userId: req.identity.id, captureId: card.id, status: card.status, rarityGrade: card.rarityGrade, gps: card.gps || null });
      return { card };
    });

    if (result.needsConfirmation) return res.status(200).json(result);
    res.status(201).json(redactPublicPayload(result.card));
  }));
  app.get('/api/v1/captures', asyncRoute(async (req, res) => res.json(redactPublicPayload(await repository.getCapturedCards(req.identity.id)))));
  app.get('/api/v1/captures/:captureId/media', asyncRoute(async (req, res) => {
    const media = await repository.getCapturedCardMedia(req.identity.id, parse(captureIdSchema, req.params.captureId));
    if (!media) return res.status(404).json({ error: { code: 'capture_media_not_found', requestId: req.id } });
    sendCaptureMedia(res, media);
  }));
  app.get('/api/v1/captures/:captureId', asyncRoute(async (req, res) => {
    const card = await repository.getCapturedCardById(req.identity.id, parse(captureIdSchema, req.params.captureId));
    if (!card) return res.status(404).json({ error: { code: 'capture_not_found', requestId: req.id } });
    res.json(redactPublicPayload(card));
  }));
  app.post('/api/v1/cards/:captureId/add', writeLimiter, asyncRoute(async (req, res) => {
    requireIdempotency(req);
    const card = await repository.getCapturedCardById(req.identity.id, parse(captureIdSchema, req.params.captureId));
    if (!card) return res.status(404).json({ error: { code: 'capture_not_found', requestId: req.id } });
    if (card.status === 'rejected') return res.status(422).json({ error: { code: 'card_not_addable', reason: 'rejected', requestId: req.id } });
    // Captures are already persisted as Library cards by the server-authoritative
    // mint step. This endpoint gives the Discovery Card's Add action an
    // idempotent contract without re-crediting rewards or duplicating cards.
    res.json({ ...card, libraryStatus: card.status === 'provisional' ? 'pending_verification' : 'added' });
  }));
  app.patch('/api/v1/captures/:captureId', writeLimiter, asyncRoute(async (req, res) => {
    const body = parse(captureRenameSchema, req.body);
    const card = await repository.updateCapturedCard(req.identity.id, parse(captureIdSchema, req.params.captureId), body);
    if (!card) return res.status(404).json({ error: { code: 'capture_not_found', requestId: req.id } });
    res.json(redactPublicPayload(card));
  }));
  app.get('/api/v1/world/hotspots', asyncRoute(async (req, res) => {
    const category = req.query.category == null || req.query.category === ''
      ? null
      : parse(hotspotCategorySchema, req.query.category);
    const bbox = req.query.bbox == null || req.query.bbox === ''
      ? null
      : parse(bboxSchema, req.query.bbox);
    // Curated content is identical for every player, so it is safe to cache
    // and revalidate the same way as the species catalog.
    sendCachedJson(req, res, await repository.listWorldHotspots({ category, bbox, limit: req.query.limit }));
  }));
  app.get('/api/v1/community/posts', asyncRoute(async (req, res) => {
    if (config.NODE_ENV === 'development') await repository.seedDemoSocial?.(req.identity.id);
    const scope = req.query.scope == null || req.query.scope === '' ? 'public' : parse(communityScopeSchema, req.query.scope);
    res.json(redactPublicPayload(await repository.listCommunityPosts(req.identity.id, { scope, limit: req.query.limit })));
  }));
  app.post('/api/v1/community/posts', writeLimiter, asyncRoute(async (req, res) => {
    const body = parse(communityPostSchema, req.body);
    const idempotencyKey = requireIdempotency(req);
    // Only the owner of a capture may share it, and rejected captures are never
    // publishable — both checked server-side against the stored card.
    const card = await repository.getCapturedCardById(req.identity.id, body.cardId);
    if (!card) return res.status(404).json({ error: { code: 'capture_not_found', requestId: req.id } });
    if (card.status === 'rejected') return res.status(422).json({ error: { code: 'capture_not_shareable', requestId: req.id } });
    if (card.status === 'provisional') return res.status(422).json({ error: { code: 'capture_not_shareable', reason: 'pending_verification', requestId: req.id } });

    // Sensitive species (poaching/stalking risk — blueprint §1/§10/§22/§27,
    // CRITICAL) get their coordinates jittered to a coarse grid cell before
    // the post is ever written, so the exact sighting location never lands
    // in a client-facing table in the first place.
    const species = card.speciesId ? SPECIES_BY_ID.get(card.speciesId) : null;
    const result = await repository.runIdempotent(req.identity.id, 'create-community-post', idempotencyKey, async () => {
      const { post, created } = await repository.createCommunityPost({
        userId: req.identity.id,
        cardId: card.id,
        caption: body.caption || '',
        hashtags: (body.hashtags || []).map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)),
        placeLabel: body.placeLabel || null,
        gps: protectedGps(card.gps || null, species),
        visibility: body.visibility || 'public',
      });
      return { post, created };
    });
    if (config.NODE_ENV !== 'test') auditLog('community_post_created', { requestId: req.id, userId: req.identity.id, postId: result.post.id, created: result.created, gps: result.post.gps || null });
    res.status(result.created ? 201 : 200).json(redactPublicPayload(result.post));
  }));
  app.get('/api/v1/community/posts/:postId/comments', asyncRoute(async (req, res) => {
    res.json(redactPublicPayload(await repository.listCommunityComments(parse(postIdSchema, req.params.postId))));
  }));
  app.get('/api/v1/community/posts/:postId/media', asyncRoute(async (req, res) => {
    const media = await repository.getCommunityPostMedia(parse(postIdSchema, req.params.postId));
    if (!media) return res.status(404).json({ error: { code: 'community_media_not_found', requestId: req.id } });
    sendCaptureMedia(res, media);
  }));
  app.post('/api/v1/community/posts/:postId/comments', writeLimiter, asyncRoute(async (req, res) => {
    const body = parse(communityCommentSchema, req.body);
    const comment = await repository.createCommunityComment(req.identity.id, parse(postIdSchema, req.params.postId), body.body);
    if (!comment) return res.status(404).json({ error: { code: 'post_not_found', requestId: req.id } });
    res.status(201).json(redactPublicPayload(comment));
  }));
  app.post('/api/v1/community/posts/:postId/like', writeLimiter, asyncRoute(async (req, res) => {
    const body = parse(communityLikeSchema, req.body);
    const post = await repository.setCommunityPostLike(req.identity.id, parse(postIdSchema, req.params.postId), body.liked);
    if (!post) return res.status(404).json({ error: { code: 'post_not_found', requestId: req.id } });
    res.json(redactPublicPayload(post));
  }));
  app.post('/api/v1/community/posts/:postId/report', writeLimiter, asyncRoute(async (req, res) => {
    const body = parse(communityReportSchema, req.body);
    const report = await repository.reportCommunityPost(req.identity.id, parse(postIdSchema, req.params.postId), body);
    if (!report) return res.status(404).json({ error: { code: 'post_not_found', requestId: req.id } });
    if (config.NODE_ENV !== 'test') auditLog('community_post_reported', { requestId: req.id, userId: req.identity.id, postId: report.postId, reason: report.reason });
    res.status(report.created ? 201 : 200).json(redactPublicPayload(report));
  }));
  app.get('/api/v1/community/friends', asyncRoute(async (req, res) => {
    if (config.NODE_ENV === 'development') await repository.seedDemoSocial?.(req.identity.id);
    res.json(redactPublicPayload(await repository.listFriends(req.identity.id)));
  }));
  app.get('/api/v1/feed', asyncRoute(async (req, res) => res.json(redactPublicPayload(await engine.feed(req.identity)))));
  app.get('/api/v1/leaderboard', asyncRoute(async (req, res) => res.json(redactPublicPayload(await engine.leaderboard(req.identity)))));
  app.get('/api/v1/rewards', asyncRoute(async (req, res) => res.json(await engine.rewards(req.identity))));
  app.post('/api/v1/rewards/claim', writeLimiter, asyncRoute(async (req, res) => res.json(await engine.claimRewards(req.identity))));
  app.get('/api/v1/notifications', asyncRoute(async (req, res) => res.json(await engine.notifications(req.identity))));
  app.post('/api/v1/notifications/:notificationId/read', writeLimiter, asyncRoute(async (req, res) => res.json(await engine.markNotificationRead(req.identity, parse(notificationIdSchema, req.params.notificationId)))));
  app.post('/api/v1/admin/submissions/:submissionId/review', writeLimiter, asyncRoute(async (req, res) => {
    const body = parse(reviewSchema, req.body);
    res.json(await engine.reviewSubmission(req.identity, parse(submissionIdSchema, req.params.submissionId), body.decision, body.reason));
  }));
  app.get('/api/v1/admin/submissions/review-queue', asyncRoute(async (req, res) => res.json(await engine.reviewQueue(req.identity))));
  // Human verification for provisional captures — blueprint §21. A/S-grade
  // and anti-cheat-flagged discoveries are minted as status='provisional'
  // (see the /api/v1/captures handler above) and stay that way — pending,
  // rewards withheld — until an admin approves or rejects them here.
  app.get('/api/v1/admin/captures/review-queue', asyncRoute(async (req, res) => {
    if (!req.identity.isAdmin) return res.status(403).json({ error: { code: 'admin_required', requestId: req.id } });
    res.json(await repository.listCaptureReviewQueue());
  }));
  app.post('/api/v1/admin/captures/:captureId/review', writeLimiter, asyncRoute(async (req, res) => {
    if (!req.identity.isAdmin) return res.status(403).json({ error: { code: 'admin_required', requestId: req.id } });
    const cardId = parse(captureIdSchema, req.params.captureId);
    const body = parse(reviewSchema, req.body);
    const existing = await repository.getCapturedCardByIdAnyUser(cardId);
    if (!existing) return res.status(404).json({ error: { code: 'capture_not_found', requestId: req.id } });
    if (existing.status !== 'provisional') {
      return res.status(409).json({ error: { code: 'capture_not_reviewable', reason: `status is '${existing.status}', not 'provisional'`, requestId: req.id } });
    }
    const reviewed = await repository.reviewCapturedCard(cardId, { decision: body.decision, reviewerId: req.identity.id, reason: body.reason || null });
    if (config.NODE_ENV !== 'test') auditLog('capture_review_decision', { requestId: req.id, reviewerId: req.identity.id, captureId: cardId, decision: body.decision });
    res.json(redactPublicPayload(reviewed));
  }));

  app.post('/api/v1/me/delete-request', writeLimiter, asyncRoute(async (req, res) => {
    const body = parse(deleteAccountSchema, req.body || {});
    const result = await repository.requestAccountDeletion(req.identity.id, { reason: body?.reason || null });
    if (config.NODE_ENV !== 'test') auditLog('account_deletion_requested', { requestId: req.id, userId: req.identity.id });
    res.status(result.created ? 202 : 200).json(redactPublicPayload(result));
  }));

  app.get('/api/quests', asyncRoute(async (req, res) => {
    let active = await engine.active(req.identity);
    const dateKey = new Date().toISOString().slice(0, 10);
    if (!active.some((item) => item.cadence === 'daily')) await engine.generateDaily(req.identity, `legacy-daily-${dateKey}`);
    if (!active.some((item) => item.cadence === 'weekly')) await engine.generateWeekly(req.identity, `legacy-weekly-${dateKey}`);
    if (!active.some((item) => item.cadence === 'monthly')) await engine.generateMonthly(req.identity, `legacy-monthly-${dateKey}`);
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
    const status = Number(error.status) || (error instanceof z.ZodError ? 400 : error instanceof ProviderNotConfiguredError ? 503 : error instanceof VisionClassificationError ? 502 : error.message === 'cors_origin_denied' ? 403 : 500);
    const parserCode = error.type === 'entity.too.large' ? 'payload_too_large' : error.type === 'entity.parse.failed' ? 'invalid_json' : null;
    const code = parserCode
      || (error instanceof z.ZodError ? 'invalid_request'
        : error instanceof ProviderNotConfiguredError ? 'provider_not_configured'
          : error instanceof VisionClassificationError ? error.code
            : status >= 500 ? 'internal_error'
              : error.code || error.message);
    if (status >= 500 && config.NODE_ENV !== 'test') auditLog('request_failed', { level: 'error', requestId: req.id, method: req.method, path: req.path, code });
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
  const providers = createProviders({ mode: config.PROVIDER_MODE, aiVerifyUrl: config.QUEST_AI_VERIFY_URL, providerSecret: config.QUEST_PROVIDER_SECRET, notificationUrl: config.QUEST_NOTIFICATION_URL });

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

function sendCachedJson(req, res, data) {
  const payload = JSON.stringify(data);
  const hash = `W/"${createHash('sha256').update(payload).digest('hex').slice(0, 16)}"`;
  res.setHeader('ETag', hash);
  res.setHeader('Cache-Control', 'private, no-cache');
  if (req.get('if-none-match') === hash) return res.status(304).end();
  return res.type('json').send(payload);
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
function parseImageDataUrl(value) {
  const match = /^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value || '');
  if (!match) return { contentType: 'image/jpeg', base64: null };
  return { contentType: match[1] === 'image/jpg' ? 'image/jpeg' : match[1], base64: match[2] };
}
function sendCaptureMedia(res, media) {
  if (media.storageRef) {
    const url = new URL(media.storageRef);
    if (url.protocol !== 'https:') throw Object.assign(new Error('invalid_media_reference'), { status: 500 });
    res.setHeader('Cache-Control', media.publicSafe ? 'public, max-age=300' : 'private, no-store');
    return res.redirect(302, url.toString());
  }
  const parsed = parseImageDataUrl(media.mediaData);
  if (!parsed.base64) throw Object.assign(new Error('invalid_media_reference'), { status: 500 });
  res.setHeader('Content-Type', parsed.contentType);
  res.setHeader('Cache-Control', media.publicSafe ? 'public, max-age=300' : 'private, no-store');
  return res.send(Buffer.from(parsed.base64, 'base64'));
}
function asyncRoute(handler) { return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next); }
function mapLegacyQuest(item) { return { id: item.id, title: item.title, summary: item.description, detail: item.description, category: item.category === 'Weekly' ? 'Discovery' : item.category, rarity: item.rarity, xp: item.xpReward, coinReward: item.coinReward ?? 0, status: legacyStatus(item.status), progress: item.targetValue ? item.progressValue / item.targetValue : 0, target: `${item.progressValue}/${item.targetValue} ${item.unit}`, instructions: item.instructions, proofType: item.verificationType.toLowerCase(), cadence: item.cadence }; }
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
