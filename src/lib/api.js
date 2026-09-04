// The web build is served by the same Express process that mounts /api (see
// api/server.js), so a same-origin relative base is correct there and needs no
// configuration. A Capacitor build is NOT same-origin — it loads from
// capacitor://localhost, where '/api' resolves to the device itself — so the
// native build must be given an absolute backend URL at build time.
// `npm run build:native` fails the build if VITE_API_BASE_URL is missing, so a
// native bundle can never reach this line with a relative base.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
  // 'dev' is a local sentinel meaning "no real token — rely on the server's
  // dev-auth bypass", not a value to send as a bearer credential.
  if (token && token !== 'dev') headers.Authorization = `Bearer ${token}`;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/v1${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      // Endpoints served via sendCachedJson set `Cache-Control: private,
      // no-cache` and an ETag. Without an explicit cache mode the browser can
      // hand back a bare 304 with no body, which is not `ok` and has no JSON
      // to parse. Letting fetch manage revalidation means it resolves the 304
      // against its own cache and always yields a complete response.
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'network_unavailable');
  }

  if (response.status === 204) return null;
  // `cache: 'no-store'` above means a bare 304 should never reach here. If one
  // does, surface it rather than returning null and blanking real data.
  if (response.status === 304) throw new ApiError(304, 'stale_revalidation_failed');

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
  GUEST_SPECIES,
  GUEST_COMMUNITY_POSTS,
  GUEST_WORLD_HOTSPOTS,
} from './guestData';
import { deleteLocalCaptureImage, saveLocalCaptureImage } from './localCaptureStore';

let guestCaptures = null;
let guestCommunityPosts = null;

const GUEST_CAPTURES_KEY = 'wild_realm_guest_captures_v1';
const GUEST_POSTS_KEY = 'wild_realm_guest_posts_v2';
const MAX_GUEST_CAPTURES = 100;
const MAX_GUEST_POSTS = 100;
const MAX_TITLE_LENGTH = 80;
const MAX_NOTES_LENGTH = 500;
const MAX_CAPTION_LENGTH = 280;

function readGuestList(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeGuestList(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function sanitizeText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
  return text || null;
}

function privateGps(gps) {
  const lat = Number(gps?.lat);
  const lng = Number(gps?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat: Math.round(lat * 1000) / 1000,
    lng: Math.round(lng * 1000) / 1000,
  };
}

function locationLabel(gps) {
  return gps ? `${gps.lat.toFixed(3)}, ${gps.lng.toFixed(3)}` : null;
}

function guestCaptureList() {
  if (!guestCaptures) guestCaptures = readGuestList(GUEST_CAPTURES_KEY, GUEST_CAPTURES);
  return guestCaptures;
}

function setGuestCaptures(next) {
  guestCaptures = next;
  writeGuestList(GUEST_CAPTURES_KEY, next);
  return guestCaptures;
}

function guestPostList() {
  if (!guestCommunityPosts) guestCommunityPosts = readGuestList(GUEST_POSTS_KEY, GUEST_COMMUNITY_POSTS);
  return guestCommunityPosts;
}

function setGuestPosts(next) {
  guestCommunityPosts = next;
  writeGuestList(GUEST_POSTS_KEY, next);
  return guestCommunityPosts;
}

async function guestDelay(data, ms = 450) {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return JSON.parse(JSON.stringify(data));
}

function makeGuestRank() {
  const ranks = [
    { grade: 'S', tier: 'Legendary', stars: 5, xp: 180 },
    { grade: 'A', tier: 'Epic', stars: 4, xp: 130 },
    { grade: 'B', tier: 'Rare', stars: 3, xp: 95 },
    { grade: 'C', tier: 'Uncommon', stars: 2, xp: 65 },
    { grade: 'D', tier: 'Common', stars: 1, xp: 35 },
  ];
  return ranks[Math.floor(Math.random() * ranks.length)];
}

export function createApiClient(getToken) {
  // Guest mode is a real product mode backed by local fixtures. For every other
  // session the server is authoritative: a failed request throws so the UI can
  // render a real error state, rather than silently swapping in fixture data
  // that would be indistinguishable from production content.
  return {
    getMe: async (signal) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_USER, 200);
      return request('/me', { signal, token });
    },
    updateMe: async (patch) => {
      const token = await getToken();
      if (false) return guestDelay({ ...GUEST_USER, ...patch }, 200);
      return request('/me', { method: 'PATCH', body: patch, token });
    },
    getDefinitions: async (filters = {}, signal) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_DEFINITIONS, 200);
      const params = new URLSearchParams();
      if (filters.cadence) params.set('cadence', filters.cadence);
      if (filters.category) params.set('category', filters.category);
      const query = params.toString();
      return request(`/quests/definitions${query ? `?${query}` : ''}`, { signal, token });
    },
    getActiveQuests: async (signal) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_ACTIVE_QUESTS, 200);
      return request('/quests/active', { signal, token });
    },
    getCollectibles: async (signal) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_COLLECTIBLES, 200);
      return request('/collectibles', { signal, token });
    },
    getCaptures: async (signal) => {
      const token = await getToken();
      if (false) return guestDelay(guestCaptureList(), 200);
      return request('/captures', { signal, token });
    },
    getSpecies: async (signal) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_SPECIES, 200);
      return request('/species', { signal, token });
    },
    createCapture: async (bundle, idempotencyKey) => {
      const token = await getToken();
      if (false) {
        const rank = makeGuestRank();
        const captureId = bundle.captureId || newIdempotencyKey();
        const imageRef = await saveLocalCaptureImage(captureId, bundle.imageBase64);
        const gps = privateGps(bundle.gps);
        const card = {
          id: captureId,
          itemName: 'Mysterious Object',
          category: ['Grass', 'Water', 'Earth', 'Sky'][Math.floor(Math.random() * 4)],
          cardTitle: 'The Curious Find',
          rarityTier: rank.tier,
          rarityGrade: rank.grade,
          rarityStars: rank.stars,
          rarityScore: Math.random(),
          xpAwarded: rank.xp,
          imageRef,
          description: 'AI observed shape, color, and context from this live capture.',
          capturedAt: bundle.capturedAt || new Date().toISOString(),
          gps,
          location: locationLabel(gps),
          status: 'saved',
          notes: null,
        };
        const combined = [card, ...guestCaptureList()];
        const removed = combined.slice(MAX_GUEST_CAPTURES);
        setGuestCaptures(combined.slice(0, MAX_GUEST_CAPTURES));
        await Promise.all(removed.map((item) => deleteLocalCaptureImage(item.imageRef)));
        return guestDelay(card, 500);
      }
      return request('/captures', { method: 'POST', body: bundle, idempotencyKey, token });
    },
    addCardToLibrary: async (captureId, idempotencyKey) => {
      const token = await getToken();
      if (false) return guestDelay(guestCaptureList().find((item) => item.id === captureId), 200);
      return request(`/cards/${captureId}/add`, { method: 'POST', idempotencyKey, token });
    },
    renameCapture: async (captureId, patch) => {
      const token = await getToken();
      const body = typeof patch === 'string' ? { cardTitle: patch } : patch;
      if (false) {
        const updates = {};
        if (Object.hasOwn(body || {}, 'cardTitle')) {
          updates.cardTitle = sanitizeText(body.cardTitle, MAX_TITLE_LENGTH) || 'Untitled discovery';
        }
        if (Object.hasOwn(body || {}, 'notes')) {
          updates.notes = sanitizeText(body.notes, MAX_NOTES_LENGTH);
        }
        const next = guestCaptureList().map((item) => (item.id === captureId ? { ...item, ...updates } : item));
        setGuestCaptures(next);
        return guestDelay(next.find((item) => item.id === captureId), 200);
      }
      return request(`/captures/${captureId}`, { method: 'PATCH', body, token });
    },
    getQuestHistory: async (signal) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_HISTORY, 200);
      return request('/quests/history', { signal, token });
    },
    generateDaily: async (idempotencyKey) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_ACTIVE_QUESTS, 200);
      return request('/quests/generate-daily', { method: 'POST', idempotencyKey, token });
    },
    generateWeekly: async (idempotencyKey) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_ACTIVE_QUESTS, 200);
      return request('/quests/generate-weekly', { method: 'POST', idempotencyKey, token });
    },
    generateMonthly: async (idempotencyKey) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_ACTIVE_QUESTS, 200);
      return request('/quests/generate-monthly', { method: 'POST', idempotencyKey, token });
    },
    postProgress: async (assignmentId, value, idempotencyKey) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_ACTIVE_QUESTS[0], 200);
      return request(`/quests/${assignmentId}/progress`, { method: 'POST', body: { value }, idempotencyKey, token });
    },
    submitProof: async (assignmentId, payload, idempotencyKey) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_ACTIVE_QUESTS[0], 200);
      return request(`/quests/${assignmentId}/submissions`, { method: 'POST', body: payload, idempotencyKey, token });
    },
    getWorldHotspots: async (filters = {}, signal) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_WORLD_HOTSPOTS, 200);
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.bbox) params.set('bbox', filters.bbox);
      const query = params.toString();
      return request(`/world/hotspots${query ? `?${query}` : ''}`, { signal, token });
    },
    getCommunityPosts: async (scope = 'public', signal) => {
      const token = await getToken();
      if (false) return guestDelay(guestPostList(), 200);
      return request(`/community/posts?scope=${encodeURIComponent(scope)}`, { signal, token });
    },
    createCommunityPost: async (payload, idempotencyKey) => {
      const token = await getToken();
      if (false) {
        const discovery = guestCaptureList().find((item) => item.id === payload.cardId);
        if (!discovery) throw new ApiError(404, 'capture_not_found');
        const post = {
          id: idempotencyKey || newIdempotencyKey(),
          author: {
            userId: GUEST_USER.id,
            displayName: GUEST_USER.displayName,
            totalXp: GUEST_USER.totalXp,
            rankTitle: GUEST_USER.tierLabel,
          },
          cardId: discovery.id,
          discovery,
          caption: sanitizeText(payload.caption, MAX_CAPTION_LENGTH)
            || sanitizeText(discovery.notes, MAX_CAPTION_LENGTH)
            || `${GUEST_USER.displayName} found ${discovery.cardTitle || discovery.itemName}.`,
          liked: false,
          likeCount: 0,
          commentCount: 0,
          createdAt: new Date().toISOString(),
        };
        setGuestPosts([post, ...guestPostList()].slice(0, MAX_GUEST_POSTS));
        return guestDelay(post, 200);
      }
      return request('/community/posts', { method: 'POST', body: payload, idempotencyKey, token });
    },
    setCommunityPostLike: async (postId, liked) => {
      const token = await getToken();
      if (false) throw new ApiError(403, 'guest_write_unavailable');
      return request(`/community/posts/${postId}/like`, { method: 'POST', body: { liked }, token });
    },
    reportCommunityPost: async (postId, reason) => {
      const token = await getToken();
      if (false) return guestDelay({ success: true }, 200);
      return request(`/community/posts/${postId}/report`, { method: 'POST', body: { reason }, token });
    },
    getCommunityComments: async (postId, signal) => {
      const token = await getToken();
      if (false) return guestDelay([], 150);
      return request(`/community/posts/${postId}/comments`, { signal, token });
    },
    createCommunityComment: async (postId, body) => {
      const token = await getToken();
      if (false) throw new ApiError(403, 'guest_write_unavailable');
      return request(`/community/posts/${postId}/comments`, { method: 'POST', body: { body }, token });
    },
    getFriends: async (signal) => {
      const token = await getToken();
      if (false) return guestDelay([], 150);
      return request('/community/friends', { signal, token });
    },
    getFeed: async (signal) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_FEED, 200);
      return request('/feed', { signal, token });
    },
    getLeaderboard: async (signal) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_LEADERBOARD, 200);
      return request('/leaderboard', { signal, token });
    },
    getRewards: async (signal) => {
      const token = await getToken();
      if (false) return guestDelay(GUEST_REWARDS, 200);
      return request('/rewards', { signal, token });
    },
    claimRewards: async () => {
      const token = await getToken();
      if (false) return guestDelay([{ level: 15 }], 200);
      return request('/rewards/claim', { method: 'POST', token });
    },
    getNotifications: async (signal) => {
      const token = await getToken();
      if (false) return guestDelay([], 200);
      return request('/notifications', { signal, token });
    },
    markNotificationRead: async (notificationId) => {
      const token = await getToken();
      if (false) return guestDelay(null, 100);
      return request(`/notifications/${notificationId}/read`, { method: 'POST', token });
    },
  };
}
