const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(status, code, requestId, reason) {
    super(code || 'request_failed');
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.reason = reason;
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
    throw new ApiError(response.status, payload?.error?.code, payload?.error?.requestId, payload?.error?.reason);
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
  const withFallback = async (fn, fallbackData) => {
    try {
      return await fn();
    } catch (err) {
      if (err?.code === 'network_unavailable' || err?.status === 0 || err?.code === 'guest_write_unavailable') {
        return guestDelay(fallbackData, 100);
      }
      throw err;
    }
  };

  return {
    getMe: async (signal) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_USER, 200);
      return withFallback(() => request('/me', { signal, token }), GUEST_USER);
    },
    updateMe: async (patch) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay({ ...GUEST_USER, ...patch }, 200);
      return withFallback(() => request('/me', { method: 'PATCH', body: patch, token }), { ...GUEST_USER, ...patch });
    },
    getDefinitions: async (filters = {}, signal) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_DEFINITIONS, 200);
      const params = new URLSearchParams();
      if (filters.cadence) params.set('cadence', filters.cadence);
      if (filters.category) params.set('category', filters.category);
      const query = params.toString();
      return withFallback(
        () => request(`/quests/definitions${query ? `?${query}` : ''}`, { signal, token }),
        GUEST_DEFINITIONS,
      );
    },
    getActiveQuests: async (signal) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_ACTIVE_QUESTS, 200);
      return withFallback(() => request('/quests/active', { signal, token }), GUEST_ACTIVE_QUESTS);
    },
    getCollectibles: async (signal) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_COLLECTIBLES, 200);
      return withFallback(() => request('/collectibles', { signal, token }), GUEST_COLLECTIBLES);
    },
    getCaptures: async (signal) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(guestCaptures || GUEST_CAPTURES, 200);
      return withFallback(() => request('/captures', { signal, token }), GUEST_CAPTURES);
    },
    createCapture: async (bundle, idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest' || !token) {
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
        return guestDelay(card, 500);
      }
      return withFallback(
        () => request('/captures', { method: 'POST', body: bundle, idempotencyKey, token }),
        GUEST_CAPTURES[0],
      );
    },
    renameCapture: async (captureId, cardTitle) => {
      const token = await getToken();
      if (token === 'guest' || !token) {
        guestCaptures = (guestCaptures || GUEST_CAPTURES).map((item) => (item.id === captureId ? { ...item, cardTitle } : item));
        return guestDelay(guestCaptures.find((item) => item.id === captureId), 200);
      }
      return withFallback(
        () => request(`/captures/${captureId}`, { method: 'PATCH', body: { cardTitle }, token }),
        GUEST_CAPTURES[0],
      );
    },
    getQuestHistory: async (signal) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_HISTORY, 200);
      return withFallback(() => request('/quests/history', { signal, token }), GUEST_HISTORY);
    },
    generateDaily: async (idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_ACTIVE_QUESTS, 200);
      return withFallback(() => request('/quests/generate-daily', { method: 'POST', idempotencyKey, token }), GUEST_ACTIVE_QUESTS);
    },
    generateWeekly: async (idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_ACTIVE_QUESTS, 200);
      return withFallback(() => request('/quests/generate-weekly', { method: 'POST', idempotencyKey, token }), GUEST_ACTIVE_QUESTS);
    },
    generateMonthly: async (idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_ACTIVE_QUESTS, 200);
      return withFallback(() => request('/quests/generate-monthly', { method: 'POST', idempotencyKey, token }), GUEST_ACTIVE_QUESTS);
    },
    postProgress: async (assignmentId, value, idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_ACTIVE_QUESTS[0], 200);
      return withFallback(
        () => request(`/quests/${assignmentId}/progress`, { method: 'POST', body: { value }, idempotencyKey, token }),
        GUEST_ACTIVE_QUESTS[0],
      );
    },
    submitProof: async (assignmentId, payload, idempotencyKey) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_ACTIVE_QUESTS[0], 200);
      return withFallback(
        () => request(`/quests/${assignmentId}/submissions`, { method: 'POST', body: payload, idempotencyKey, token }),
        GUEST_ACTIVE_QUESTS[0],
      );
    },
    getFeed: async (signal) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_FEED, 200);
      return withFallback(() => request('/feed', { signal, token }), GUEST_FEED);
    },
    getLeaderboard: async (signal) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_LEADERBOARD, 200);
      return withFallback(() => request('/leaderboard', { signal, token }), GUEST_LEADERBOARD);
    },
    getRewards: async (signal) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(GUEST_REWARDS, 200);
      return withFallback(() => request('/rewards', { signal, token }), GUEST_REWARDS);
    },
    claimRewards: async () => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay([{ level: 15 }], 200);
      return withFallback(() => request('/rewards/claim', { method: 'POST', token }), [{ level: 15 }]);
    },
    getNotifications: async (signal) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay([], 200);
      return withFallback(() => request('/notifications', { signal, token }), []);
    },
    markNotificationRead: async (notificationId) => {
      const token = await getToken();
      if (token === 'guest' || !token) return guestDelay(null, 100);
      return withFallback(() => request(`/notifications/${notificationId}/read`, { method: 'POST', token }), null);
    },
  };
}
