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
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(2).default(0),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_AUTH: z.coerce.number().int().min(1).default(120),
  RATE_LIMIT_READS: z.coerce.number().int().min(1).default(240),
  RATE_LIMIT_WRITES: z.coerce.number().int().min(1).default(40),
  REQUEST_BODY_LIMIT: z.string().regex(/^\d+(kb|mb)$/i).default('128kb'),
  PROVIDER_MODE: z.enum(['local', 'disabled']).default('disabled'),
  RENDER_EXTERNAL_URL: z.string().url().optional(),
});

export function loadConfig(env = process.env) {
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

  if (config.NODE_ENV === 'production') {
    const missingOidc = !config.OIDC_ISSUER || !config.OIDC_AUDIENCE;
    const insecureOidc = [config.OIDC_ISSUER, config.OIDC_JWKS_URL].filter(Boolean).some((value) => new URL(value).protocol !== 'https:');
    if (!config.databaseUrl || config.DEV_AUTH_ENABLED || config.DEV_ALLOW_LEGACY_MUTATIONS || config.PROVIDER_MODE === 'local' || missingOidc || insecureOidc) {
      throw new Error('Production requires PostgreSQL, HTTPS OIDC, disabled development auth, disabled legacy mutations, and non-local providers.');
    }
  }

  return Object.freeze(config);
}
