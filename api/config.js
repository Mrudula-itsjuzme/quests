import { z } from 'zod';

const booleanValue = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}, z.boolean());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().min(1).max(253).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  POSTGRES_URL: z.string().min(1).optional(),
  DATABASE_SSL: booleanValue.default(false),
  DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60_000).default(8_000),
  DEV_AUTH_ENABLED: booleanValue.default(false),
  DEV_ALLOW_LEGACY_MUTATIONS: booleanValue.default(false),
  DEV_USER_ID: z.string().min(1).max(200).default('00000000-0000-4000-8000-000000000001'),
  DEV_USER_TIMEZONE: z.string().default('UTC').refine((value) => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }, 'must be an IANA timezone'),
  OIDC_ISSUER: z.string().url().optional(),
  OIDC_AUDIENCE: z.string().min(1).optional(),
  OIDC_JWKS_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  VITE_API_BASE_URL: z.string().min(1).optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173,capacitor://localhost'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(2).default(0),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_AUTH: z.coerce.number().int().min(1).default(120),
  RATE_LIMIT_READS: z.coerce.number().int().min(1).default(240),
  RATE_LIMIT_WRITES: z.coerce.number().int().min(1).default(40),
  REQUEST_BODY_LIMIT: z.string().regex(/^\d+(kb|mb)$/i).default('10mb'),
  PROVIDER_MODE: z.enum(['local', 'disabled', 'http']).default('disabled'),
  QUEST_AI_VERIFY_URL: z.string().url().optional(),
  QUEST_PROVIDER_SECRET: z.string().min(16).optional(),
  QUEST_PROVIDER_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30_000).default(10_000),
  QUEST_PROVIDER_MAX_RETRIES: z.coerce.number().int().min(0).max(2).default(1),
  QUEST_NOTIFICATION_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(16).optional(),
  RENDER_EXTERNAL_URL: z.string().url().optional(),
  VISION_PROVIDER: z.enum(['stub', 'openrouter']).default('stub'),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_VISION_MODEL: z.string().min(1).default('google/gemini-2.0-flash-001'),
  VISION_PROVIDER_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30_000).default(20_000),
  VISION_PROVIDER_MAX_RETRIES: z.coerce.number().int().min(0).max(2).default(1),
  INCLUDE_DEMO_HOTSPOTS: booleanValue.optional(),
});

export function loadConfig(env = process.env, options = {}) {
  const result = schema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid configuration: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
  }

  const config = result.data;
  if (config.SUPABASE_URL) {
    const supabaseBase = config.SUPABASE_URL.replace(/\/$/, '');
    config.OIDC_ISSUER ||= `${supabaseBase}/auth/v1`;
    config.OIDC_AUDIENCE ||= 'authenticated';
    config.OIDC_JWKS_URL ||= `${supabaseBase}/auth/v1/.well-known/jwks.json`;
    config.SUPABASE_AUTH = true;
  } else {
    config.SUPABASE_AUTH = false;
  }
  config.databaseUrl = config.DATABASE_URL || config.POSTGRES_URL;
  config.corsOrigins = config.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (config.NODE_ENV !== 'production' && env.VITE_API_BASE_URL) {
    try {
      const viteApiOrigin = new URL(env.VITE_API_BASE_URL).origin;
      if (!config.corsOrigins.includes(viteApiOrigin)) {
        config.corsOrigins.push(viteApiOrigin);
      }
    } catch {
      // Vite validates native build API URLs separately; ignore relative values here.
    }
  }
  config.selfOrigin = config.RENDER_EXTERNAL_URL?.replace(/\/$/, '') || null;
  config.listenHost = config.HOST || (config.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
  config.includeDemoHotspots = config.INCLUDE_DEMO_HOTSPOTS ?? config.NODE_ENV !== 'production';

  if (options.isMigration) {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL or POSTGRES_URL is required for database migrations.');
    }
    return Object.freeze(config);
  }

  if (config.NODE_ENV === 'production') {
    if (!config.databaseUrl) {
      throw new Error('Production requires a valid PostgreSQL connection string (DATABASE_URL).');
    }
    if (config.DEV_AUTH_ENABLED) {
      throw new Error('Production requires DEV_AUTH_ENABLED to be disabled.');
    }
    if (config.DEV_ALLOW_LEGACY_MUTATIONS) {
      throw new Error('Production requires DEV_ALLOW_LEGACY_MUTATIONS to be disabled.');
    }
    if (!config.OIDC_ISSUER || !config.OIDC_AUDIENCE) {
      throw new Error('Production requires OIDC_ISSUER and OIDC_AUDIENCE, or SUPABASE_URL so they can be derived.');
    }
    if (!config.SUPABASE_URL || !config.VITE_SUPABASE_URL || !config.VITE_SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Production requires SUPABASE_URL, VITE_SUPABASE_URL, and VITE_SUPABASE_PUBLISHABLE_KEY.');
    }
    if (config.VITE_SUPABASE_URL.replace(/\/$/, '') !== config.SUPABASE_URL.replace(/\/$/, '')) {
      throw new Error('VITE_SUPABASE_URL must match SUPABASE_URL in production.');
    }
    if (looksLikeServiceRoleKey(config.VITE_SUPABASE_PUBLISHABLE_KEY)) {
      throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY must be a publishable/anon key, never a service-role key.');
    }
    if (!config.VITE_API_BASE_URL) {
      throw new Error('Production requires VITE_API_BASE_URL (/api for same-origin web, or an absolute HTTPS URL for native builds).');
    }
    if (config.VITE_API_BASE_URL !== '/api') {
      let apiUrl;
      try { apiUrl = new URL(config.VITE_API_BASE_URL); } catch { throw new Error('Production VITE_API_BASE_URL must be /api or an absolute HTTPS URL.'); }
      if (apiUrl.protocol !== 'https:') throw new Error('Production VITE_API_BASE_URL must be /api or an absolute HTTPS URL.');
    }
    const insecureOidc = [config.OIDC_ISSUER, config.OIDC_JWKS_URL].filter(Boolean).some((value) => new URL(value).protocol !== 'https:');
    if (insecureOidc) {
      throw new Error('Production requires HTTPS OIDC endpoints.');
    }
    if (config.PROVIDER_MODE !== 'http') {
      throw new Error('Production requires PROVIDER_MODE=http so quest proof verification is backed by an external verifier.');
    }
    if (!config.QUEST_AI_VERIFY_URL || !config.QUEST_PROVIDER_SECRET) {
      throw new Error('Production requires configured HTTP quest providers (QUEST_AI_VERIFY_URL and QUEST_PROVIDER_SECRET).');
    }
    if (new URL(config.QUEST_AI_VERIFY_URL).protocol !== 'https:') {
      throw new Error('Production requires HTTPS quest provider endpoints.');
    }
    if (!config.CRON_SECRET) {
      throw new Error('Production requires CRON_SECRET for the authenticated scheduler endpoint.');
    }
    if (!config.corsOrigins.length || config.corsOrigins.includes('*')) {
      throw new Error('Production requires explicit production CORS origins.');
    }
    const nativeOrigins = new Set(['capacitor://localhost', 'http://localhost']);
    const insecureCors = config.corsOrigins.some((origin) => {
      try {
        return new URL(origin).protocol !== 'https:' && !nativeOrigins.has(origin);
      } catch {
        return true;
      }
    });
    if (insecureCors) {
      throw new Error('Production CORS origins must use HTTPS, except the exact Capacitor origins capacitor://localhost and http://localhost.');
    }
    if (config.TRUST_PROXY > 1) {
      throw new Error('Production TRUST_PROXY must be scoped to the known edge proxy hop.');
    }
    if (config.VISION_PROVIDER === 'stub') {
      throw new Error('Production requires VISION_PROVIDER=openrouter; the deterministic stub is development/test only.');
    }
    if (config.VISION_PROVIDER === 'openrouter' && !config.OPENROUTER_API_KEY) {
      throw new Error('Production requires OPENROUTER_API_KEY when VISION_PROVIDER=openrouter.');
    }
  }

  return Object.freeze(config);
}

function looksLikeServiceRoleKey(value) {
  if (/service[_-]?role/i.test(value)) return true;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}
