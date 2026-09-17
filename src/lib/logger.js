const APP_VERSION = '1.2.0';

export function logError(context, error, extra = {}) {
  if (typeof console === 'undefined') return;
  const status = error?.status ?? 0;
  const code = error?.code || error?.name || 'unknown_error';
  const requestId = error?.requestId || extra.requestId || null;

  console.error(`[Wild Realm ${APP_VERSION}] ${context}`, {
    code,
    status,
    requestId,
    message: error?.message,
    ...sanitizeExtra(extra),
  });
}

export function logInfo(context, extra = {}) {
  if (typeof console === 'undefined') return;
  console.info(`[Wild Realm ${APP_VERSION}] ${context}`, sanitizeExtra(extra));
}

function sanitizeExtra(extra) {
  if (!extra || typeof extra !== 'object') return {};
  const sanitized = {};
  const SENSITIVE_KEYS = new Set(['token', 'password', 'authorization', 'secret', 'apiKey', 'accessToken']);
  for (const [key, value] of Object.entries(extra)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
}
