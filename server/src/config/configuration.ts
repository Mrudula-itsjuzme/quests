export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  cors: {
    origins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  },
  auth: {
    jwksUrl: process.env.AUTH_JWKS_URL,
    issuer: process.env.AUTH_ISSUER,
    audience: process.env.AUTH_AUDIENCE,
    devBypassSecret: process.env.AUTH_DEV_BYPASS_SECRET,
  },
  ai: {
    provider: process.env.AI_VISION_PROVIDER ?? 'stub', // 'openai' | 'gemini' | 'stub'
    openAiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    approveThreshold: parseFloat(process.env.AI_APPROVE_THRESHOLD ?? '0.85'),
    manualReviewThreshold: parseFloat(process.env.AI_MANUAL_REVIEW_THRESHOLD ?? '0.5'),
  },
  cronSecret: process.env.CRON_SECRET,
});
