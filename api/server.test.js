// @vitest-environment node
import request from 'supertest';
import { createApp } from './server.js';
import { loadConfig } from './config.js';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { QuestEngine } from './lib/quest-engine.js';
import { MemoryQuestRepository } from './lib/memory-repository.js';
import { createProviders } from './lib/providers.js';
import { questDefinitions } from './lib/quest-definitions.js';

function testConfig(overrides = {}) {
  return loadConfig({ NODE_ENV: 'test', DEV_AUTH_ENABLED: 'true', DEV_ALLOW_LEGACY_MUTATIONS: 'true', PROVIDER_MODE: 'local', ...overrides });
}

describe('Quest API', () => {
  it('exposes liveness, readiness, and security headers', async () => {
    const app = createApp({ config: testConfig() });
    const health = await request(app).get('/health');
    const ready = await request(app).get('/ready');
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: 'ok', database: 'memory-fallback', requestId: expect.any(String) });
    expect(health.headers['x-content-type-options']).toBe('nosniff');
    expect(ready.body).toEqual({ status: 'ready', database: 'memory', providerMode: 'local' });
    expect(ready.headers['cache-control']).toBe('no-store');
  });

  it('allows browser fetches to Supabase via CSP connect-src', async () => {
    const app = createApp({ config: testConfig() });
    const health = await request(app).get('/health');
    expect(health.headers['content-security-policy']).toContain("connect-src 'self' https://*.supabase.co");
  });

  it('scopes the CORS allowlist to /api and never blocks static assets by origin', async () => {
    const app = createApp({ config: testConfig({ CORS_ORIGINS: 'https://app.example.com' }) });
    const asset = await request(app).get('/does-not-exist-but-not-cors-checked').set('Origin', 'https://evil.example.com');
    expect(asset.status).not.toBe(403);
  });

  it('requires authentication when development identity is disabled', async () => {
    const app = createApp({ config: testConfig({ DEV_AUTH_ENABLED: 'false' }) });
    const response = await request(app).get('/api/v1/me');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('authentication_required');
  });

  it('rate-limits unauthenticated requests before JWT verification', async () => {
    const app = createApp({ config: testConfig({ DEV_AUTH_ENABLED: 'false', RATE_LIMIT_AUTH: '1' }) });
    expect((await request(app).get('/api/v1/me')).status).toBe(401);
    const limited = await request(app).get('/api/v1/me');
    expect(limited.status).toBe(429);
  });

  it('rejects malformed bearer tokens without echoing them', async () => {
    const app = createApp({ config: testConfig({ DEV_AUTH_ENABLED: 'false', OIDC_ISSUER: 'https://identity.example.com', OIDC_AUDIENCE: 'habbit-api' }) });
    const response = await request(app).get('/api/v1/me').set('Authorization', 'Bearer secret.invalid.token');
    expect(response.status).toBe(401);
    expect(JSON.stringify(response.body)).not.toContain('secret.invalid.token');
    expect(response.body.error.code).toBe('invalid_access_token');
  });

  it('rejects wrong JWT issuers, audiences, and algorithms', async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const jwk = await exportJWK(publicKey);
    jwk.kid = 'test-key';
    jwk.alg = 'RS256';
    const authJwks = createLocalJWKSet({ keys: [jwk] });
    const config = testConfig({ DEV_AUTH_ENABLED: 'false', OIDC_ISSUER: 'https://identity.example.com', OIDC_AUDIENCE: 'habbit-api' });
    const app = createApp({ config, authJwks });
    const wrongIssuer = await signedToken(privateKey, { issuer: 'https://evil.example.com', audience: 'habbit-api' });
    const wrongAudience = await signedToken(privateKey, { issuer: 'https://identity.example.com', audience: 'another-api' });
    const wrongAlgorithm = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256', kid: 'test-key' })
      .setSubject('signed-user')
      .setIssuer('https://identity.example.com')
      .setAudience('habbit-api')
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode('not-an-approved-asymmetric-key'));
    expect((await request(app).get('/api/v1/me').set('Authorization', `Bearer ${wrongIssuer}`)).body.error.code).toBe('invalid_access_token');
    expect((await request(app).get('/api/v1/me').set('Authorization', `Bearer ${wrongAudience}`)).body.error.code).toBe('invalid_access_token');
    expect((await request(app).get('/api/v1/me').set('Authorization', `Bearer ${wrongAlgorithm}`)).body.error.code).toBe('invalid_access_token');
  });

  it('accepts only authenticated Supabase user tokens', async () => {
    const { publicKey, privateKey } = await generateKeyPair('ES256');
    const jwk = await exportJWK(publicKey);
    jwk.kid = 'supabase-key';
    jwk.alg = 'ES256';
    const authJwks = createLocalJWKSet({ keys: [jwk] });
    const config = testConfig({ DEV_AUTH_ENABLED: 'false', SUPABASE_URL: 'https://project-ref.supabase.co' });
    const app = createApp({ config, authJwks });
    const authenticated = await new SignJWT({ role: 'authenticated', name: 'Ari' })
      .setProtectedHeader({ alg: 'ES256', kid: 'supabase-key' })
      .setSubject('5cb09f6d-a44b-4df0-b36f-505a92dafe26')
      .setIssuer(config.OIDC_ISSUER)
      .setAudience('authenticated')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    const serviceRole = await new SignJWT({ role: 'service_role' })
      .setProtectedHeader({ alg: 'ES256', kid: 'supabase-key' })
      .setSubject('5cb09f6d-a44b-4df0-b36f-505a92dafe26')
      .setIssuer(config.OIDC_ISSUER)
      .setAudience('authenticated')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    expect((await request(app).get('/api/v1/me').set('Authorization', `Bearer ${authenticated}`)).status).toBe(200);
    expect((await request(app).get('/api/v1/me').set('Authorization', `Bearer ${serviceRole}`)).body.error.code).toBe('invalid_access_token');
  });

  it('persists onboarding preferences without resetting progression', async () => {
    const repository = new MemoryQuestRepository({ definitions: questDefinitions });
    const providers = createProviders({ mode: 'local', now: () => new Date('2026-07-13T10:00:00.000Z') });
    const engine = new QuestEngine({ repository, providers, random: () => 0 });
    const app = createApp({ config: testConfig(), repository, providers, engine });
    const generated = await request(app).post('/api/v1/quests/generate-daily').set('Idempotency-Key', 'profile-daily-001').send({});
    await engine.completeLegacy({ id: testConfig().DEV_USER_ID, displayName: 'Local Adventurer', timezone: 'UTC' }, generated.body[0].id);
    const before = await request(app).get('/api/v1/me');
    const updated = await request(app).patch('/api/v1/me').send({
      displayName: 'Ari',
      timezone: 'Asia/Kolkata',
      primaryPath: 'Mind',
      reminderTime: '20:30',
      motionPreference: 'reduced',
      onboardingCompleted: true,
      tourVersionSeen: 1,
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual(expect.objectContaining({
      displayName: 'Ari',
      timezone: 'Asia/Kolkata',
      primaryPath: 'Mind',
      reminderTime: '20:30',
      motionPreference: 'reduced',
      onboardingCompletedAt: '2026-07-13T10:00:00.000Z',
      tourVersionSeen: 1,
      totalXp: before.body.totalXp,
      streakDays: before.body.streakDays,
    }));
  });

  it('rejects malformed profile updates', async () => {
    const app = createApp({ config: testConfig() });
    const response = await request(app).patch('/api/v1/me').send({ timezone: 'Mars/Olympus', reminderTime: '29:99' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_request');
  });

  it('generates exactly one daily quest per category and replays idempotently', async () => {
    const app = createApp({ config: testConfig() });
    const first = await request(app).post('/api/v1/quests/generate-daily').set('Idempotency-Key', 'daily-request-001').send({});
    const replay = await request(app).post('/api/v1/quests/generate-daily').set('Idempotency-Key', 'daily-request-001').send({});
    expect(first.status).toBe(201);
    expect(first.body.map((item) => item.category).sort()).toEqual(['Body', 'Discovery', 'Mind']);
    expect(replay.body).toEqual(first.body);
  });

  it('serves every v1 read shape and completes AUTO, TEXT, and PHOTO writes', async () => {
    const repository = new MemoryQuestRepository({ definitions: questDefinitions });
    const providers = createProviders({ mode: 'local', now: () => new Date('2026-07-13T10:00:00.000Z') });
    const engine = new QuestEngine({ repository, providers, random: () => 0 });
    const app = createApp({ config: testConfig(), repository, providers, engine });
    const generated = await request(app).post('/api/v1/quests/generate-daily').set('Idempotency-Key', 'daily-actions-001').send({});
    const auto = generated.body.find((item) => item.verificationType === 'AUTO');
    const text = generated.body.find((item) => item.verificationType === 'TEXT');
    const photo = generated.body.find((item) => item.verificationType === 'PHOTO');

    const progressed = await request(app).post(`/api/v1/quests/${auto.id}/progress`).set('Idempotency-Key', 'progress-actions-001').send({ value: auto.targetValue });
    const written = await request(app).post(`/api/v1/quests/${text.id}/submissions`).set('Idempotency-Key', 'text-actions-001').send({ text: 'A meaningful written proof for this quest.' });
    const photographed = await request(app).post(`/api/v1/quests/${photo.id}/submissions`).set('Idempotency-Key', 'photo-actions-001').send({ uploadId: 'local_actions01' });
    const weekly = await request(app).post('/api/v1/quests/generate-weekly').set('Idempotency-Key', 'weekly-actions-001').send({});
    const [me, active, history, definitions] = await Promise.all([
      request(app).get('/api/v1/me'),
      request(app).get('/api/v1/quests/active'),
      request(app).get('/api/v1/quests/history'),
      request(app).get('/api/v1/quests/definitions?cadence=daily'),
    ]);

    expect(progressed.body.completed).toBe(true);
    expect(written.body.completed).toBe(true);
    expect(photographed.body.completed).toBe(true);
    expect(weekly.body).toEqual(expect.objectContaining({ cadence: 'weekly', verificationType: 'PHOTO' }));
    expect(me.body).toEqual(expect.objectContaining({ id: expect.any(String), totalXp: expect.any(Number), level: expect.any(Number), streakDays: 1 }));
    expect(active.body).toEqual([expect.objectContaining({ cadence: 'weekly' })]);
    expect(history.body).toHaveLength(3);
    expect(definitions.body.every((item) => item.cadence === 'daily')).toBe(true);
  });

  it('serves the public species catalog to authenticated users only', async () => {
    const app = createApp({ config: testConfig() });
    const anonymous = await request(app).get('/api/v1/species').set('Authorization', '');
    const authed = await request(app).get('/api/v1/species');
    expect(anonymous.status).toBe(200); // dev-auth bypass applies without a header in test mode
    expect(authed.status).toBe(200);
    expect(Array.isArray(authed.body)).toBe(true);
    expect(authed.body.length).toBeGreaterThan(0);
    expect(authed.body[0]).toEqual(expect.objectContaining({ id: expect.any(String), commonName: expect.any(String), element: expect.any(String), category: expect.any(String) }));
    expect(authed.body.every((entry) => !('enabled' in entry))).toBe(true);
  });

  it('rejects the species catalog without a valid token when dev auth is disabled', async () => {
    const app = createApp({ config: testConfig({ DEV_AUTH_ENABLED: 'false' }) });
    const response = await request(app).get('/api/v1/species');
    expect(response.status).toBe(401);
  });

  it('rejects versioned writes without an idempotency key', async () => {
    const app = createApp({ config: testConfig() });
    const response = await request(app).post('/api/v1/quests/generate-daily').send({});
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('idempotency_key_required');
  });

  it('rejects malformed assignment identifiers before PostgreSQL sees them', async () => {
    const app = createApp({ config: testConfig() });
    const response = await request(app).post('/api/v1/quests/not-a-uuid/progress').set('Idempotency-Key', 'progress-request-001').send({ value: 1 });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_request');
  });

  it('does not expose database error codes in production-shaped errors', async () => {
    const engine = { async getMe() { const error = new Error('sensitive database detail'); error.code = '23505'; throw error; } };
    const app = createApp({ config: testConfig(), engine });
    const response = await request(app).get('/api/v1/me');
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('internal_error');
    expect(JSON.stringify(response.body)).not.toContain('23505');
  });

  it('keeps legacy quest response shapes and ignores account selectors', async () => {
    const app = createApp({ config: testConfig() });
    const quests = await request(app).get('/api/quests?account=another-user');
    const collectibles = await request(app).get('/api/collectibles?account=another-user');
    expect(quests.status).toBe(200);
    expect(quests.body).toHaveLength(5);
    expect(quests.body[0]).toEqual(expect.objectContaining({ id: expect.any(String), title: expect.any(String), xp: expect.any(Number), proofType: expect.any(String) }));
    expect(collectibles.body).toEqual([]);
  });

  it('allows legacy creation only in the explicitly enabled development path', async () => {
    const allowed = createApp({ config: testConfig() });
    const created = await request(allowed).post('/api/quests').send({ title: 'Local Quest', category: 'Mind', rarity: 'Common', xp: 25 });
    expect(created.status).toBe(201);
    expect(created.body).toEqual(expect.objectContaining({ title: 'Local Quest', cadence: 'custom' }));

    const denied = createApp({ config: testConfig({ DEV_ALLOW_LEGACY_MUTATIONS: 'false' }) });
    const response = await request(denied).post('/api/quests').send({ title: 'Blocked Quest' });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('legacy_mutation_disabled');
  });

  it('rejects malformed and oversized semantic payloads', async () => {
    const app = createApp({ config: testConfig() });
    const response = await request(app).post('/api/quests').send({ title: '', instructions: new Array(20).fill('x') });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_request');
  });

  it('rejects transport bodies over the configured byte limit', async () => {
    const app = createApp({ config: testConfig({ REQUEST_BODY_LIMIT: '1kb' }) });
    const response = await request(app).post('/api/quests').send({ title: 'x'.repeat(2000) });
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('payload_too_large');
  });

  it('enforces the CORS allowlist', async () => {
    const app = createApp({ config: testConfig({ CORS_ORIGINS: 'https://app.example.com' }) });
    const denied = await request(app).get('/api/v1/me').set('Origin', 'https://evil.example.com');
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('cors_origin_denied');
  });

  it('runs a capture through the anti-cheat gate and mints a final card when telemetry is clean', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const response = await request(app)
      .post('/api/v1/captures')
      .set('Idempotency-Key', 'capture-001')
      .send({
        captureId: '11111111-1111-4111-8111-111111111111',
        imageBase64: PIXEL_PNG,
        capturedAt: new Date().toISOString(),
        gps: { lat: 12.9, lng: 77.6, accuracyM: 12 },
        heading: 45,
        liveness: { attested: true, method: 'capture-input-environment', score: 0.7 },
      });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('final');
    expect(response.body.antiCheatVerdict).toBe('PASS');
    expect(response.body.itemName).toBe('House Sparrow');
  });

  it('marks a capture provisional when a single anti-cheat flag is raised', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const response = await request(app)
      .post('/api/v1/captures')
      .set('Idempotency-Key', 'capture-002')
      .send({ imageBase64: PIXEL_PNG, liveness: { attested: false } });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('provisional');
    expect(response.body.antiCheatVerdict).toBe('PASS_WITH_REVIEW');
  });

  it('rejects a capture outright when two anti-cheat flags are raised', async () => {
    const app = createApp({ config: testConfig() });
    const response = await request(app)
      .post('/api/v1/captures')
      .set('Idempotency-Key', 'capture-003')
      .send({
        imageBase64: PIXEL_PNG,
        capturedAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        liveness: { attested: false },
      });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('anti_cheat_rejected');
    expect(response.body.error.reason).toBe('multiple_integrity_flags');
  });

  it('polls a minted capture back by its id', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const created = await request(app).post('/api/v1/captures').set('Idempotency-Key', 'capture-004').send({ imageBase64: PIXEL_PNG });
    const fetched = await request(app).get(`/api/v1/captures/${created.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.id).toBe(created.body.id);
  });

  it('actually credits the capture XP reward to the player total, not just the card', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const before = await request(app).get('/api/v1/me');
    const captured = await request(app)
      .post('/api/v1/captures')
      .set('Idempotency-Key', 'capture-xp-001')
      .send({ imageBase64: PIXEL_PNG, liveness: { attested: true, method: 'capture-input-environment', score: 0.7 } });
    expect(captured.body.status).toBe('final');
    expect(captured.body.xpAwarded).toBeGreaterThan(0);
    const after = await request(app).get('/api/v1/me');
    expect(after.body.totalXp).toBe(before.body.totalXp + captured.body.xpAwarded);
  });

  it('does not credit XP for a provisional (pending-review) capture until it is verified', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const before = await request(app).get('/api/v1/me');
    const captured = await request(app)
      .post('/api/v1/captures')
      .set('Idempotency-Key', 'capture-xp-002')
      .send({ imageBase64: PIXEL_PNG, liveness: { attested: false } });
    expect(captured.body.status).toBe('provisional');
    const after = await request(app).get('/api/v1/me');
    expect(after.body.totalXp).toBe(before.body.totalXp);
  });

  it('asks for confirmation instead of minting when identification confidence is below threshold', async () => {
    const app = createApp({ config: testConfig() });
    const response = await request(app)
      .post('/api/v1/captures')
      .set('Idempotency-Key', 'capture-005')
      .send({ imageBase64: PIXEL_PNG });
    expect(response.status).toBe(200);
    expect(response.body.needsConfirmation).toBe(true);
    expect(response.body.candidates.length).toBeGreaterThan(0);
  });

  it('mints a card once a candidate is chosen after a low-confidence identification', async () => {
    const app = createApp({ config: testConfig() });
    const first = await request(app).post('/api/v1/captures').set('Idempotency-Key', 'capture-006').send({ imageBase64: PIXEL_PNG });
    expect(first.body.needsConfirmation).toBe(true);
    const second = await request(app)
      .post('/api/v1/captures')
      .set('Idempotency-Key', 'capture-007')
      .send({ imageBase64: PIXEL_PNG, chosenCandidateIndex: 0 });
    expect(second.status).toBe(201);
    expect(second.body.itemName).toBe(first.body.candidates[0].commonName);
  });

  it('credits capture coins to a server-authoritative wallet balance', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const before = await request(app).get('/api/v1/me');
    expect(before.body.coins).toBe(0);
    const captured = await mintCapture(app, 'coin-001');
    expect(captured.body.coinsAwarded).toBeGreaterThan(0);
    const after = await request(app).get('/api/v1/me');
    expect(after.body.coins).toBe(captured.body.coinsAwarded);
  });

  it('does not credit coins for a provisional capture until it is verified', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const captured = await request(app)
      .post('/api/v1/captures')
      .set('Idempotency-Key', 'coin-002')
      .send({ imageBase64: PIXEL_PNG, liveness: { attested: false } });
    expect(captured.body.status).toBe('provisional');
    const me = await request(app).get('/api/v1/me');
    expect(me.body.coins).toBe(0);
  });
});

describe('Community API', () => {
  it('shares a capture as a real post carrying the author rank and discovery', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const card = await mintCapture(app, 'community-001');
    const created = await request(app)
      .post('/api/v1/community/posts')
      .set('Idempotency-Key', 'community-post-001')
      .send({ cardId: card.body.id, caption: 'Found near the lake', hashtags: ['birding'] });

    expect(created.status).toBe(201);
    expect(created.body.discovery.itemName).toBe('House Sparrow');
    expect(created.body.author.rankTitle).toBe('Adventurer');
    expect(created.body.hashtags).toEqual(['#birding']);
    expect(created.body.likeCount).toBe(0);

    const feed = await request(app).get('/api/v1/community/posts');
    expect(feed.status).toBe(200);
    expect(feed.body).toHaveLength(1);
    expect(feed.body[0].id).toBe(created.body.id);
  });

  it('refuses to share a capture the caller does not own', async () => {
    const repository = new MemoryQuestRepository({ definitions: questDefinitions });
    const app = createApp({ config: testConfig(), repository, visionProvider: highConfidenceVisionProvider() });
    await repository.ensureUser({ id: 'someone-else', displayName: 'Other', timezone: 'UTC' });
    const foreign = await repository.createCapturedCard({ userId: 'someone-else', itemName: 'Red Fox', category: 'Fauna', cardTitle: 'Red Fox', rarityTier: 'B', rarityScore: 0.5, description: '', status: 'final' });

    const response = await request(app)
      .post('/api/v1/community/posts')
      .set('Idempotency-Key', 'community-post-foreign')
      .send({ cardId: foreign.id });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('capture_not_found');
  });

  it('never publishes a rejected capture', async () => {
    const repository = new MemoryQuestRepository({ definitions: questDefinitions });
    const app = createApp({ config: testConfig(), repository, visionProvider: highConfidenceVisionProvider() });
    await repository.ensureUser({ id: '00000000-0000-4000-8000-000000000001', displayName: 'Local', timezone: 'UTC' });
    const card = await repository.createCapturedCard({ userId: '00000000-0000-4000-8000-000000000001', itemName: 'Blurry Thing', category: 'Fauna', cardTitle: 'Blurry Thing', rarityTier: 'D', rarityScore: 0.1, description: '', status: 'rejected' });

    const response = await request(app)
      .post('/api/v1/community/posts')
      .set('Idempotency-Key', 'community-post-rejected')
      .send({ cardId: card.id });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('capture_not_shareable');
  });

  it('does not create duplicate posts when the same capture is shared twice', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const card = await mintCapture(app, 'community-002');
    const first = await request(app).post('/api/v1/community/posts').set('Idempotency-Key', 'community-dup-a').send({ cardId: card.body.id });
    const second = await request(app).post('/api/v1/community/posts').set('Idempotency-Key', 'community-dup-b').send({ cardId: card.body.id });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    const feed = await request(app).get('/api/v1/community/posts');
    expect(feed.body).toHaveLength(1);
  });

  it('toggles likes idempotently and reports the viewer state', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const card = await mintCapture(app, 'community-003');
    const post = await request(app).post('/api/v1/community/posts').set('Idempotency-Key', 'like-post').send({ cardId: card.body.id });

    const liked = await request(app).post(`/api/v1/community/posts/${post.body.id}/like`).send({ liked: true });
    expect(liked.body.likeCount).toBe(1);
    expect(liked.body.viewerLiked).toBe(true);

    const likedAgain = await request(app).post(`/api/v1/community/posts/${post.body.id}/like`).send({ liked: true });
    expect(likedAgain.body.likeCount).toBe(1);

    const unliked = await request(app).post(`/api/v1/community/posts/${post.body.id}/like`).send({ liked: false });
    expect(unliked.body.likeCount).toBe(0);
    expect(unliked.body.viewerLiked).toBe(false);
  });

  it('records comments and reflects them in the post counter', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const card = await mintCapture(app, 'community-004');
    const post = await request(app).post('/api/v1/community/posts').set('Idempotency-Key', 'comment-post').send({ cardId: card.body.id });

    const comment = await request(app).post(`/api/v1/community/posts/${post.body.id}/comments`).send({ body: 'Beautiful find!' });
    expect(comment.status).toBe(201);
    expect(comment.body.body).toBe('Beautiful find!');

    const comments = await request(app).get(`/api/v1/community/posts/${post.body.id}/comments`);
    expect(comments.body).toHaveLength(1);
    const feed = await request(app).get('/api/v1/community/posts');
    expect(feed.body[0].commentCount).toBe(1);
  });

  it('rejects invalid post payloads and unknown posts', async () => {
    const app = createApp({ config: testConfig(), visionProvider: highConfidenceVisionProvider() });
    const badCard = await request(app).post('/api/v1/community/posts').set('Idempotency-Key', 'community-bad-1').send({ cardId: 'not-a-uuid' });
    expect(badCard.status).toBe(400);

    const missingKey = await request(app).post('/api/v1/community/posts').send({ cardId: '11111111-1111-4111-8111-111111111111' });
    expect(missingKey.status).toBe(400);
    expect(missingKey.body.error.code).toBe('idempotency_key_required');

    const unknownPost = await request(app).post('/api/v1/community/posts/11111111-1111-4111-8111-111111111111/like').send({ liked: true });
    expect(unknownPost.status).toBe(404);
  });

  it('returns an empty friends list rather than fabricated explorers', async () => {
    const app = createApp({ config: testConfig() });
    const response = await request(app).get('/api/v1/community/friends');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

function mintCapture(app, idempotencyKey) {
  return request(app)
    .post('/api/v1/captures')
    .set('Idempotency-Key', idempotencyKey)
    .send({ imageBase64: PIXEL_PNG, liveness: { attested: true, method: 'capture-input-environment', score: 0.7 } });
}

function highConfidenceVisionProvider() {
  return {
    identify: async () => ({
      candidates: [
        { commonName: 'House Sparrow', scientificName: 'Passer domesticus', category: 'Fauna', element: 'Sky', ecosystem: 'Urban', confidence: 0.92 },
      ],
    }),
  };
}

const PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function signedToken(privateKey, { issuer, audience }) {
  return new SignJWT({ name: 'Tester', zoneinfo: 'UTC' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setSubject('signed-user')
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
}
