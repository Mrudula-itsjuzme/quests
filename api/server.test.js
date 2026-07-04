import { createApp } from './server.js';

async function dispatch(app, method, path, { params = {}, body = {}, query = {} } = {}) {
  const layer = app._router.stack.find((item) => item.route?.path === path && item.route.methods[method.toLowerCase()]);
  if (!layer) throw new Error(`Route not found: ${method} ${path}`);

  const response = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  await layer.route.stack[0].handle({ params, body, query }, response);
  return response;
}

describe('API health', () => {
  it('returns a healthy status', async () => {
    const app = createApp();

    const response = await dispatch(app, 'GET', '/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'memory-fallback' });
  });

  it('returns seed quests when no database is configured', async () => {
    const app = createApp();

    const response = await dispatch(app, 'GET', '/api/quests');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'daily-focus', title: 'Morning Mindfulness' }),
      ]),
    );
  });

  it('validates quest creation payloads', async () => {
    const app = createApp();

    const response = await dispatch(app, 'POST', '/api/quests', { body: { title: '' } });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Quest title is required' });
  });

  it('can complete a fallback quest without a database', async () => {
    const app = createApp();

    const response = await dispatch(app, 'POST', '/api/quests/:id/complete', { params: { id: 'daily-focus' } });

    expect(response.statusCode).toBe(200);
    expect(response.body.quest).toEqual(expect.objectContaining({ id: 'daily-focus', status: 'Completed', progress: 1 }));
    expect(response.body.collectible).toEqual(expect.objectContaining({ assetId: 'wisp-focus', title: 'Focus Wisp' }));
  });

  it('returns an empty fallback collection when no database is configured', async () => {
    const app = createApp();

    const response = await dispatch(app, 'GET', '/api/collectibles');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });
});
