import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

const productionClientEnv = {
  SUPABASE_URL: 'https://project-ref.supabase.co',
  VITE_SUPABASE_URL: 'https://project-ref.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_value',
  VITE_API_BASE_URL: '/api',
};

describe('configuration security', () => {
  it('keeps development identity, mock providers, and public listeners opt-in', () => {
    const config = loadConfig({ NODE_ENV: 'development' });
    expect(config).toEqual(expect.objectContaining({
      DEV_AUTH_ENABLED: false,
      DEV_ALLOW_LEGACY_MUTATIONS: false,
      PROVIDER_MODE: 'disabled',
      listenHost: '127.0.0.1',
      REQUEST_BODY_LIMIT: '10mb',
    }));
    expect(config.corsOrigins).toContain('capacitor://localhost');
  });

  it('adds the Vite API origin to development CORS for local phone testing', () => {
    const config = loadConfig({
      NODE_ENV: 'development',
      CORS_ORIGINS: 'http://localhost:3000',
      VITE_API_BASE_URL: 'http://10.12.71.162:3001',
    });

    expect(config.corsOrigins).toContain('http://localhost:3000');
    expect(config.corsOrigins).toContain('http://10.12.71.162:3001');
  });

  it('rejects development authentication, local providers, and ephemeral storage in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/Production requires a valid PostgreSQL/);
  });

  it('accepts an explicitly hardened production configuration', () => {
    const config = loadConfig({
      ...productionClientEnv,
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'false',
      DEV_ALLOW_LEGACY_MUTATIONS: 'false',
      PROVIDER_MODE: 'http',
      QUEST_AI_VERIFY_URL: 'https://verify.example.com/v1/proofs',
      QUEST_PROVIDER_SECRET: 'provider-secret-value',
      CRON_SECRET: 'cron-secret-value',
      DATABASE_URL: 'postgres://quest_app:secret@db:5432/quests',
      OIDC_ISSUER: 'https://identity.example.com',
      OIDC_AUDIENCE: 'habbit-api',
      CORS_ORIGINS: 'https://app.example.com',
      VISION_PROVIDER: 'openrouter',
      OPENROUTER_API_KEY: 'openrouter-key-value',
    });
    expect(config.corsOrigins).toEqual(['https://app.example.com']);
    expect(config.DEV_AUTH_ENABLED).toBe(false);
    expect(config.includeDemoHotspots).toBe(false);
  });

  it('allows only the exact native Capacitor origins as production HTTP exceptions', () => {
    const base = {
      ...productionClientEnv,
      NODE_ENV: 'production', DATABASE_URL: 'postgres://quest_app:secret@db:5432/quests',
      PROVIDER_MODE: 'http', QUEST_AI_VERIFY_URL: 'https://verify.example.com/v1/proofs',
      QUEST_PROVIDER_SECRET: 'provider-secret-value', CRON_SECRET: 'cron-secret-value',
      VISION_PROVIDER: 'openrouter',
      OPENROUTER_API_KEY: 'openrouter-key-value',
    };
    expect(() => loadConfig({ ...base, CORS_ORIGINS: 'https://app.example.com,capacitor://localhost,http://localhost' })).not.toThrow();
    expect(() => loadConfig({ ...base, CORS_ORIGINS: 'http://device.example.com' })).toThrow(/Capacitor origins/);
  });

  it('rejects mismatched client auth, service-role keys, and insecure client API URLs', () => {
    const base = {
      ...productionClientEnv,
      NODE_ENV: 'production', DATABASE_URL: 'postgres://quest_app:secret@db:5432/quests',
      PROVIDER_MODE: 'http', QUEST_AI_VERIFY_URL: 'https://verify.example.com/v1/proofs',
      QUEST_PROVIDER_SECRET: 'provider-secret-value', CRON_SECRET: 'cron-secret-value',
      CORS_ORIGINS: 'https://app.example.com', VISION_PROVIDER: 'openrouter',
      OPENROUTER_API_KEY: 'openrouter-key-value',
    };
    expect(() => loadConfig({ ...base, VITE_SUPABASE_URL: 'https://other-project.supabase.co' })).toThrow(/must match SUPABASE_URL/);
    expect(() => loadConfig({ ...base, VITE_SUPABASE_PUBLISHABLE_KEY: 'service_role_secret' })).toThrow(/never a service-role key/);
    expect(() => loadConfig({ ...base, VITE_API_BASE_URL: 'http://api.example.com/api' })).toThrow(/absolute HTTPS URL/);
  });

  it('rejects the stub vision provider in production without an override', () => {
    expect(() => loadConfig({
      ...productionClientEnv,
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'false',
      DEV_ALLOW_LEGACY_MUTATIONS: 'false',
      PROVIDER_MODE: 'http',
      QUEST_AI_VERIFY_URL: 'https://verify.example.com/v1/proofs',
      QUEST_PROVIDER_SECRET: 'provider-secret-value',
      CRON_SECRET: 'cron-secret-value',
      DATABASE_URL: 'postgres://quest_app:secret@db:5432/quests',
      OIDC_ISSUER: 'https://identity.example.com',
      OIDC_AUDIENCE: 'habbit-api',
      CORS_ORIGINS: 'https://app.example.com',
    })).toThrow(/VISION_PROVIDER=openrouter/);
  });

  it('derives the Supabase issuer, audience, and asymmetric JWKS endpoint', () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://project-ref.supabase.co',
    });
    expect(config).toEqual(expect.objectContaining({
      SUPABASE_AUTH: true,
      OIDC_ISSUER: 'https://project-ref.supabase.co/auth/v1',
      OIDC_AUDIENCE: 'authenticated',
      OIDC_JWKS_URL: 'https://project-ref.supabase.co/auth/v1/.well-known/jwks.json',
    }));
  });

  it('rejects plaintext OIDC metadata in production', () => {
    expect(() => loadConfig({
      ...productionClientEnv,
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'false',
      DEV_ALLOW_LEGACY_MUTATIONS: 'false',
      PROVIDER_MODE: 'http',
      QUEST_AI_VERIFY_URL: 'https://verify.example.com/v1/proofs',
      QUEST_PROVIDER_SECRET: 'provider-secret-value',
      CRON_SECRET: 'cron-secret-value',
      DATABASE_URL: 'postgres://quest_app:secret@db:5432/quests',
      OIDC_ISSUER: 'http://identity.example.com',
      OIDC_AUDIENCE: 'habbit-api',
    })).toThrow(/HTTPS OIDC/);
  });

  it('requires Supabase client configuration, scheduler secret, and HTTPS proof endpoint in production', () => {
    const base = {
      ...productionClientEnv,
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'false',
      DEV_ALLOW_LEGACY_MUTATIONS: 'false',
      PROVIDER_MODE: 'http',
      QUEST_AI_VERIFY_URL: 'https://verify.example.com/v1/proofs',
      QUEST_PROVIDER_SECRET: 'provider-secret-value',
      CRON_SECRET: 'cron-secret-value',
      DATABASE_URL: 'postgres://quest_app:secret@db:5432/quests',
      CORS_ORIGINS: 'https://app.example.com',
      VISION_PROVIDER: 'openrouter',
      OPENROUTER_API_KEY: 'openrouter-key-value',
    };
    expect(() => loadConfig({ ...base, SUPABASE_URL: undefined })).toThrow(/SUPABASE_URL/);
    expect(() => loadConfig(base)).not.toThrow();
    expect(() => loadConfig({
      ...base,
      OIDC_ISSUER: 'https://identity.example.com',
      OIDC_AUDIENCE: 'habbit-api',
      CRON_SECRET: undefined,
    })).toThrow(/CRON_SECRET/);
    expect(() => loadConfig({
      ...base,
      OIDC_ISSUER: 'https://identity.example.com',
      OIDC_AUDIENCE: 'habbit-api',
      QUEST_AI_VERIFY_URL: 'http://verify.example.com/v1/proofs',
    })).toThrow(/HTTPS quest provider/);
  });

  it('rejects disabled or local proof providers in production', () => {
    const base = {
      ...productionClientEnv,
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'false',
      DEV_ALLOW_LEGACY_MUTATIONS: 'false',
      DATABASE_URL: 'postgres://quest_app:secret@db:5432/quests',
      OIDC_ISSUER: 'https://identity.example.com',
      OIDC_AUDIENCE: 'habbit-api',
      CORS_ORIGINS: 'https://app.example.com',
      VISION_PROVIDER: 'openrouter',
      OPENROUTER_API_KEY: 'openrouter-key-value',
    };
    expect(() => loadConfig({ ...base, PROVIDER_MODE: 'disabled' })).toThrow(/PROVIDER_MODE=http/);
    expect(() => loadConfig({ ...base, PROVIDER_MODE: 'local' })).toThrow(/PROVIDER_MODE=http/);
  });

  it('rejects wildcard production CORS and public proxy trust', () => {
    const base = {
      ...productionClientEnv,
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'false',
      DEV_ALLOW_LEGACY_MUTATIONS: 'false',
      PROVIDER_MODE: 'http',
      QUEST_AI_VERIFY_URL: 'https://verify.example.com/v1/proofs',
      QUEST_PROVIDER_SECRET: 'provider-secret-value',
      CRON_SECRET: 'cron-secret-value',
      DATABASE_URL: 'postgres://quest_app:secret@db:5432/quests',
      OIDC_ISSUER: 'https://identity.example.com',
      OIDC_AUDIENCE: 'habbit-api',
      VISION_PROVIDER: 'openrouter',
      OPENROUTER_API_KEY: 'openrouter-key-value',
    };
    expect(() => loadConfig({ ...base, CORS_ORIGINS: '*' })).toThrow(/explicit production CORS/);
    expect(() => loadConfig({ ...base, CORS_ORIGINS: 'http://app.example.com' })).toThrow(/exact Capacitor origins/);
    expect(() => loadConfig({ ...base, CORS_ORIGINS: 'https://app.example.com', TRUST_PROXY: '2' })).toThrow(/TRUST_PROXY/);
  });

  it('rejects invalid timezones and malformed numeric limits', () => {
    expect(() => loadConfig({ NODE_ENV: 'test', DEV_USER_TIMEZONE: 'Mars/Olympus' })).toThrow(/IANA timezone/);
    expect(() => loadConfig({ NODE_ENV: 'test', RATE_LIMIT_WRITES: '0' })).toThrow(/RATE_LIMIT_WRITES/);
  });
});
