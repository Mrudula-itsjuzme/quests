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
    }));
  });

  it('rejects development authentication, local providers, and ephemeral storage in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/Production requires PostgreSQL/);
  });

  it('accepts an explicitly hardened production configuration', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      DEV_AUTH_ENABLED: 'false',
      DEV_ALLOW_LEGACY_MUTATIONS: 'false',
      PROVIDER_MODE: 'disabled',
      DATABASE_URL: 'postgres://quest_app:secret@db:5432/quests',
      OIDC_ISSUER: 'https://identity.example.com',
      OIDC_AUDIENCE: 'habbit-api',
      CORS_ORIGINS: 'https://app.example.com',
    });
    expect(config.corsOrigins).toEqual(['https://app.example.com']);
    expect(config.DEV_AUTH_ENABLED).toBe(false);
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
      PROVIDER_MODE: 'disabled',
      DATABASE_URL: 'postgres://quest_app:secret@db:5432/quests',
      OIDC_ISSUER: 'http://identity.example.com',
      OIDC_AUDIENCE: 'habbit-api',
    })).toThrow(/HTTPS OIDC/);
  });

  it('rejects invalid timezones and malformed numeric limits', () => {
    expect(() => loadConfig({ NODE_ENV: 'test', DEV_USER_TIMEZONE: 'Mars/Olympus' })).toThrow(/IANA timezone/);
    expect(() => loadConfig({ NODE_ENV: 'test', RATE_LIMIT_WRITES: '0' })).toThrow(/RATE_LIMIT_WRITES/);
  });
});
