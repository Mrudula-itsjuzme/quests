const required = [
  'DATABASE_URL',
  'PROVIDER_MODE',
  'QUEST_AI_VERIFY_URL',
  'QUEST_PROVIDER_SECRET',
  'OIDC_ISSUER',
  'OIDC_JWKS_URL',
  'CORS_ORIGINS',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing required production environment variables:', missing.join(', '));
  process.exit(1);
}
console.log('All required production environment variables are present.');
