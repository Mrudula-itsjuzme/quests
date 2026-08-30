const REDACTED = '[redacted]';
const SENSITIVE_KEYS = new Set([
  'authorization',
  'token',
  'secret',
  'password',
  'apiKey',
  'api_key',
  'OPENROUTER_API_KEY',
  'QUEST_PROVIDER_SECRET',
  'CRON_SECRET',
]);

export function auditLog(event, details = {}, logger = console) {
  const payload = sanitize({
    level: details.level || 'info',
    event,
    ...details,
  });
  const sink = payload.level === 'error' ? logger.error : payload.level === 'warn' ? logger.warn : logger.info;
  sink.call(logger, JSON.stringify(payload));
}

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key)) {
      output[key] = REDACTED;
      continue;
    }
    if (key === 'gps' && child && typeof child === 'object') {
      output[key] = {
        present: true,
        obfuscated: Boolean(child.obfuscated),
      };
      continue;
    }
    output[key] = sanitize(child);
  }
  return output;
}
