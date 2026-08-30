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
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173,capacitor://localhost'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(2).default(0),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_AUTH: z.coerce.number().int().min(1).default(120),
  RATE_LIMIT_READS: z.coerce.number().int().min(1).default(240),
  RATE_LIMIT_WRITES: z.coerce.number().int().min(1).default(40),
  REQUEST_BODY_LIMIT: z.string().regex(/^\d+(kb|mb)$/i).default('8mb'),
  PROVIDER_MODE: z.enum(['local', 'disabled', 'http']).default('disabled'),
  QUEST_AI_VERIFY_URL: z.string().url().optional(),
  QUEST_PROVIDER_SECRET: z.string().min(16).optional(),
  QUEST_NOTIFICATION_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(16).optional(),
  RENDER_EXTERNAL_URL: z.string().url().optional(),
  ALLOW_STUB_VISION_IN_PRODUCTION: booleanValue.default(false),
  VISION_PROVIDER: z.enum(['stub', 'openrouter']).default('stub'),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_VISION_MODEL: z.string().min(1).default('google/gemini-2.0-flash-001'),
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
  config.selfOrigin = config.RENDER_EXTERNAL_URL?.replace(/\/$/, '') || null;
  config.listenHost = config.HOST || (config.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

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
    const insecureOidc = [config.OIDC_ISSUER, config.OIDC_JWKS_URL].filter(Boolean).some((value) => new URL(value).protocol !== 'https:');
    if (insecureOidc) {
      throw new Error('Production requires HTTPS OIDC endpoints.');
    }
    if (config.PROVIDER_MODE === 'http' && (!config.QUEST_AI_VERIFY_URL || !config.QUEST_PROVIDER_SECRET)) {
      throw new Error('Production requires configured HTTP quest providers (QUEST_AI_VERIFY_URL and QUEST_PROVIDER_SECRET).');
    }
    if (!config.corsOrigins.length || config.corsOrigins.includes('*')) {
      throw new Error('Production requires explicit production CORS origins.');
    }
    const insecureCors = config.corsOrigins.some((origin) => new URL(origin).protocol !== 'https:');
    if (insecureCors) {
      throw new Error('Production requires HTTPS production CORS origins.');
    }
    if (config.TRUST_PROXY > 1) {
      throw new Error('Production TRUST_PROXY must be scoped to the known edge proxy hop.');
    }
    if (config.VISION_PROVIDER === 'stub' && !config.ALLOW_STUB_VISION_IN_PRODUCTION) {
      throw new Error('Production requires a real VISION_PROVIDER (stub identification would mint fake species for every capture). Set VISION_PROVIDER=openrouter and OPENROUTER_API_KEY, or set ALLOW_STUB_VISION_IN_PRODUCTION=true for demo deployments.');
    }
    if (config.VISION_PROVIDER === 'openrouter' && !config.OPENROUTER_API_KEY) {
      throw new Error('Production requires OPENROUTER_API_KEY when VISION_PROVIDER=openrouter.');
    }
  }

  return Object.freeze(config);
}
