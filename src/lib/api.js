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

import {
  GUEST_USER,
  GUEST_ACTIVE_QUESTS,
  GUEST_HISTORY,
  GUEST_COLLECTIBLES,
  GUEST_DEFINITIONS,
  GUEST_FEED,
  GUEST_LEADERBOARD,
  GUEST_REWARDS,
  GUEST_CAPTURES,
} from './guestData';

let guestCaptures = null;

async function guestDelay(data, ms = 450) {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return JSON.parse(JSON.stringify(data));
}

export function createApiClient(getToken) {
  return {
    getMe: async (signal) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(GUEST_USER, 400);
      return request('/me', { signal, token });
    },
    updateMe: async (patch) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay({ ...GUEST_USER, ...patch }, 200);
      return request('/me', { method: 'PATCH', body: patch, token });
    },
    getDefinitions: async (filters = {}, signal) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(GUEST_DEFINITIONS, 450);
      const params = new URLSearchParams();
      if (filters.cadence) params.set('cadence', filters.cadence);
      if (filters.category) params.set('category', filters.category);
      const query = params.toString();
      return request(`/quests/definitions${query ? `?${query}` : ''}`, { signal, token });
    },
    getActiveQuests: async (signal) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(GUEST_ACTIVE_QUESTS, 500);
      return request('/quests/active', { signal, token });
    },
    getCollectibles: async (signal) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(GUEST_COLLECTIBLES, 450);
      return request('/collectibles', { signal, token });
    },
    getCaptures: async (signal) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(guestCaptures || GUEST_CAPTURES, 400);
      return request('/captures', { signal, token });
    },
    createCapture: async (imageBase64, idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest') {
        const card = {
          id: newIdempotencyKey(),
          itemName: 'Mysterious Object',
          category: ['Mind', 'Body', 'Discovery'][Math.floor(Math.random() * 3)],
          cardTitle: 'The Curious Find',
          rarityTier: ['Bronze', 'Silver', 'Gold', 'Platinum'][Math.floor(Math.random() * 4)],
          rarityScore: Math.random(),
          description: 'A guest-mode capture — sign in to use the real rarity engine.',
          capturedAt: new Date().toISOString(),
        };
        guestCaptures = [card, ...(guestCaptures || GUEST_CAPTURES)];
        return guestDelay(card, 900);
      }
      return request('/captures', { method: 'POST', body: { imageBase64 }, idempotencyKey, token });
    },
    renameCapture: async (captureId, cardTitle) => {
      const token = await getToken();
      if (token === 'guest') {
        guestCaptures = (guestCaptures || GUEST_CAPTURES).map((item) => (item.id === captureId ? { ...item, cardTitle } : item));
        return guestDelay(guestCaptures.find((item) => item.id === captureId), 200);
      }
      return request(`/captures/${captureId}`, { method: 'PATCH', body: { cardTitle }, token });
    },
    getQuestHistory: async (signal) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(GUEST_HISTORY, 400);
      return request('/quests/history', { signal, token });
    },
    generateDaily: async (idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(GUEST_ACTIVE_QUESTS, 300);
      return request('/quests/generate-daily', { method: 'POST', idempotencyKey, token });
    },
    generateWeekly: async (idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(GUEST_ACTIVE_QUESTS, 300);
      return request('/quests/generate-weekly', { method: 'POST', idempotencyKey, token });
    },
    generateMonthly: async (idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(GUEST_ACTIVE_QUESTS, 300);
      return request('/quests/generate-monthly', { method: 'POST', idempotencyKey, token });
    },
    postProgress: async (assignmentId, value, idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest') throw new ApiError(401, 'guest_write_unavailable');
      return request(`/quests/${assignmentId}/progress`, { method: 'POST', body: { value }, idempotencyKey, token });
    },
    submitProof: async (assignmentId, payload, idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest') throw new ApiError(401, 'guest_write_unavailable');
      return request(`/quests/${assignmentId}/submissions`, { method: 'POST', body: payload, idempotencyKey, token });
    },
    getFeed: async (signal) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(GUEST_FEED, 550);
      return request('/feed', { signal, token });
    },
    getLeaderboard: async (signal) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(GUEST_LEADERBOARD, 450);
      return request('/leaderboard', { signal, token });
    },
    getRewards: async (signal) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(GUEST_REWARDS, 500);
      return request('/rewards', { signal, token });
    },
    claimRewards: async () => {
      const token = await getToken();
      if (token === 'guest') return guestDelay([{ level: 15 }], 300);
      return request('/rewards/claim', { method: 'POST', token });
    },
    getNotifications: async (signal) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay([], 300);
      return request('/notifications', { signal, token });
    },
    markNotificationRead: async (notificationId) => {
      const token = await getToken();
      if (token === 'guest') return guestDelay(null, 100);
      return request(`/notifications/${notificationId}/read`, { method: 'POST', token });
    },
  };
}
