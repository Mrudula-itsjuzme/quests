import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

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
  });

  it('rejects the stub vision provider in production unless explicitly allowed', () => {
    expect(() => loadConfig({
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
    })).toThrow(/Production requires a real VISION_PROVIDER/);

    const config = loadConfig({
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
      ALLOW_STUB_VISION_IN_PRODUCTION: 'true',
    });
    expect(config.VISION_PROVIDER).toBe('stub');
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

  it('requires real auth metadata, scheduler secret, and HTTPS proof endpoint in production', () => {
    const base = {
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
    expect(() => loadConfig(base)).toThrow(/OIDC_ISSUER and OIDC_AUDIENCE/);
    expect(() => loadConfig({ ...base, SUPABASE_URL: 'https://project-ref.supabase.co' })).not.toThrow();
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
    expect(() => loadConfig({ ...base, CORS_ORIGINS: 'http://app.example.com' })).toThrow(/HTTPS production CORS/);
    expect(() => loadConfig({ ...base, CORS_ORIGINS: 'https://app.example.com', TRUST_PROXY: '2' })).toThrow(/TRUST_PROXY/);
  });

  it('rejects invalid timezones and malformed numeric limits', () => {
    expect(() => loadConfig({ NODE_ENV: 'test', DEV_USER_TIMEZONE: 'Mars/Olympus' })).toThrow(/IANA timezone/);
    expect(() => loadConfig({ NODE_ENV: 'test', RATE_LIMIT_WRITES: '0' })).toThrow(/RATE_LIMIT_WRITES/);
  });
});
