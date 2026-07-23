const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(status, code, requestId) {
    super(code || 'request_failed');
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export function newIdempotencyKey() {
  return crypto.randomUUID();
}

async function request(path, { method = 'GET', body, token, idempotencyKey, signal } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/v1${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError(0, 'network_unavailable');
  }

  if (response.status === 204) return null;

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(response.status, payload?.error?.code, payload?.error?.requestId);
  }
  return payload;
}

export function createApiClient(getToken) {
  const withToken = async (options) => ({ ...options, token: await getToken() });

  return {
    getMe: async (signal) => request('/me', await withToken({ signal })),
    updateMe: async (patch) => request('/me', await withToken({ method: 'PATCH', body: patch })),
    getDefinitions: async (filters = {}, signal) => {
      const params = new URLSearchParams();
      if (filters.cadence) params.set('cadence', filters.cadence);
      if (filters.category) params.set('category', filters.category);
      const query = params.toString();
      return request(`/quests/definitions${query ? `?${query}` : ''}`, await withToken({ signal }));
    },
    getActiveQuests: async (signal) => request('/quests/active', await withToken({ signal })),
    getCollectibles: async (signal) => request('/collectibles', await withToken({ signal })),
    getQuestHistory: async (signal) => request('/quests/history', await withToken({ signal })),
    generateDaily: async (idempotencyKey) => request('/quests/generate-daily', await withToken({ method: 'POST', idempotencyKey })),
    generateWeekly: async (idempotencyKey) => request('/quests/generate-weekly', await withToken({ method: 'POST', idempotencyKey })),
    postProgress: async (assignmentId, value, idempotencyKey) =>
      request(`/quests/${assignmentId}/progress`, await withToken({ method: 'POST', body: { value }, idempotencyKey })),
    submitProof: async (assignmentId, payload, idempotencyKey) =>
      request(`/quests/${assignmentId}/submissions`, await withToken({ method: 'POST', body: payload, idempotencyKey })),
  };
}
