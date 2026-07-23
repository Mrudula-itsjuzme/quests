import { createRemoteJWKSet, jwtVerify } from 'jose';
import { assertTimeZone } from './lib/time.js';

export function createAuthMiddleware(config, options = {}) {
  let jwks = options.jwks;
  if (!jwks && config.OIDC_ISSUER) {
    const url = config.OIDC_JWKS_URL || `${config.OIDC_ISSUER.replace(/\/$/, '')}/.well-known/jwks.json`;
    jwks = createRemoteJWKSet(new URL(url), { cooldownDuration: 30_000, timeoutDuration: 5_000 });
  }

  return async function authenticate(req, res, next) {
    try {
      const authorization = req.get('authorization') || '';
      if (!authorization.startsWith('Bearer ')) {
        if (config.DEV_AUTH_ENABLED && config.NODE_ENV !== 'production') {
          req.identity = { id: config.DEV_USER_ID, displayName: 'Local Adventurer', timezone: config.DEV_USER_TIMEZONE };
          return next();
        }
        return res.status(401).json({ error: { code: 'authentication_required', requestId: req.id } });
      }
      if (!jwks) return res.status(503).json({ error: { code: 'oidc_not_configured', requestId: req.id } });
      const token = authorization.slice(7);
      const { payload } = await jwtVerify(token, jwks, { issuer: config.OIDC_ISSUER, audience: config.OIDC_AUDIENCE, algorithms: ['RS256', 'ES256'], clockTolerance: 5 });
      if (typeof payload.sub !== 'string' || payload.sub.length < 1 || payload.sub.length > 200) throw new Error('invalid_subject');
      if (config.SUPABASE_AUTH && payload.role !== 'authenticated') throw new Error('invalid_role');
      req.identity = { id: payload.sub, displayName: safeClaim(payload.name, 'Adventurer'), timezone: safeTimeZone(payload.zoneinfo) };
      return next();
    } catch {
      return res.status(401).json({ error: { code: 'invalid_access_token', requestId: req.id } });
    }
  };
}

function safeTimeZone(value) {
  try { return assertTimeZone(safeClaim(value, 'UTC')); } catch { return 'UTC'; }
}

function safeClaim(value, fallback) {
  return typeof value === 'string' && value.length > 0 && value.length <= 120 ? value : fallback;
}
