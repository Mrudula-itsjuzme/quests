// @vitest-environment node
import request from 'supertest';
import { createApp } from './server.js';
import { loadConfig } from './config.js';
import { MemoryQuestRepository } from './lib/memory-repository.js';

it('finds actual accounts by name without injecting demo users', async () => {
  const repository = new MemoryQuestRepository({ includeDemoHotspots: false });
  await repository.ensureUser({ id: '11111111-1111-4111-8111-111111111111', displayName: 'Mira Fern' });
  await repository.ensureUser({ id: '22222222-2222-4222-8222-222222222222', displayName: 'Mira Lake' });
  const config = loadConfig({ NODE_ENV: 'test', DEV_AUTH_ENABLED: 'true' });
  const app = createApp({ config, repository });
  const response = await request(app).get('/api/v1/community/search?q=mira&limit=1');
  expect(response.status).toBe(200);
  expect(response.body).toHaveLength(1);
  expect(response.body[0]).toMatchObject({ displayName: 'Mira Fern', stats: { posts: 0 } });
  expect((await request(app).get('/api/v1/community/search?q=unmatched')).body).toEqual([]);
});
it('rejects malformed search input and unbounded limits', async () => {
  const app = createApp({ config: loadConfig({ NODE_ENV: 'test', DEV_AUTH_ENABLED: 'true' }) });
  for (const query of ['q=a&limit=100000', 'q=a&limit=-1', 'q=a&q=b', `q=${'a'.repeat(81)}`]) {
    expect((await request(app).get(`/api/v1/community/search?${query}`)).status).toBe(400);
  }
});

it('hides an account awaiting deletion from search, direct profiles and new follows', async () => {
  const repository = new MemoryQuestRepository({ includeDemoHotspots: false });
  const userId = '33333333-3333-4333-8333-333333333333';
  await repository.ensureUser({ id: userId, displayName: 'Departing Explorer' });
  await repository.requestAccountDeletion(userId);
  const app = createApp({ config: loadConfig({ NODE_ENV: 'test', DEV_AUTH_ENABLED: 'true' }), repository });
  expect((await request(app).get('/api/v1/community/search?q=Departing')).body).toEqual([]);
  expect((await request(app).get(`/api/v1/community/users/${userId}`)).status).toBe(404);
  expect(await repository.setCommunityFollow('viewer', userId, true)).toBeNull();
  expect(repository.follows).toHaveLength(0);
});

it('enforces inactive account state even while its authentication is valid', async () => {
  const repository = new MemoryQuestRepository({ includeDemoHotspots: false });
  const config = loadConfig({ NODE_ENV: 'test', DEV_AUTH_ENABLED: 'true' });
  await repository.ensureUser({ id: config.DEV_USER_ID, displayName: 'Inactive Explorer' });
  const app = createApp({ config, repository });
  for (const status of ['suspended', 'banned', 'deleted']) {
    repository.users.get(config.DEV_USER_ID).status = status;
    const response = await request(app).get('/api/v1/me');
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('account_inactive');
  }
  repository.users.get(config.DEV_USER_ID).status = 'deletion_requested';
  expect((await request(app).patch('/api/v1/me').send({ displayName: 'Changed' })).status).toBe(403);
  expect((await request(app).get('/api/v1/me')).status).toBe(200);
});
