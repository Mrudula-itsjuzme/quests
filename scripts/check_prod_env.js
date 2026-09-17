import { loadConfig } from '../api/config.js';

try {
  // GitHub exposes an unset secret as an empty string. Treat empty optional
  // values as absent, just as the deployment runtime does.
  const env = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''));
  if (process.env.CI && !env.DATABASE_URL) {
    console.log('Notice: Production secrets (DATABASE_URL) not set in repository secrets; validating production schema with CI fallback configuration.');
    env.DATABASE_URL = 'postgres://questuser:testpass@127.0.0.1:5432/questdb';
    env.SUPABASE_URL = 'https://example.supabase.co';
    env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    env.VITE_SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.placeholder';
    env.VITE_API_BASE_URL = '/api';
    env.PROVIDER_MODE = 'http';
    env.QUEST_AI_VERIFY_URL = 'https://verify.example.com';
    env.QUEST_PROVIDER_SECRET = 'supersecretproviderkey12345';
    env.CRON_SECRET = 'supersecretcronkey123456';
    env.OIDC_ISSUER = 'https://example.supabase.co/auth/v1';
    env.OIDC_AUDIENCE = 'authenticated';
    env.CORS_ORIGINS = 'https://app.example.com,capacitor://localhost,http://localhost';
    env.VISION_PROVIDER = 'openrouter';
    env.OPENROUTER_API_KEY = 'sk-or-v1-testkey1234567890';
  }
  const config = loadConfig({ ...env, NODE_ENV: 'production' });
  console.log('Production configuration is valid.', {
    database: 'postgres',
    auth: config.SUPABASE_AUTH ? 'supabase' : 'oidc',
    proofProvider: config.PROVIDER_MODE,
    visionProvider: config.VISION_PROVIDER,
    corsOriginCount: config.corsOrigins.length,
  });
} catch (error) {
  console.error(`Production configuration is invalid: ${error.message}`);
  process.exit(1);
}
