import { loadConfig } from '../api/config.js';

try {
  // GitHub exposes an unset secret as an empty string. Treat empty optional
  // values as absent, just as the deployment runtime does.
  const env = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''));
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
