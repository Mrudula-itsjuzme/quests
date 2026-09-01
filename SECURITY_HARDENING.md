# Security & Production Hardening Checklist

This checklist summarizes recommended hardening steps for a production deploy suitable for ~1k daily users.

Basic (must-do)
- [x] Enforce secure config validation (HTTPS OIDC/CORS, provider-mode, real vision provider) — implemented in `api/config.js`.
- [x] Run DB migrations in deploy pipeline; include `023` and `024` migrations to support 10-quest behavior.
- [x] Add CI to run unit and integration tests on push/PR — `.github/workflows/ci.yml` added.
- [x] Ensure secrets are stored in a secrets manager (Vault/Cloud KMS) and not in repo or plain env files.

Network & runtime
- [ ] Require TLS termination at edge; set `TRUST_PROXY` to number of hops.
- [ ] Harden CORS to explicit production origins only; avoid `*` in `CORS_ORIGINS`.
- [ ] Enforce HSTS at the CDN/proxy level.

Authentication & authorization
- [ ] Verify OIDC provider settings and rotating JWKS; enable token introspection or proper audience checks.
- [ ] Disable dev auth (`DEV_AUTH_ENABLED=false`) in production.

Data & backups
- [ ] Automated DB backups (daily incremental + weekly full) and periodic restore drills.
- [ ] Enable point-in-time recovery for Postgres when running on managed services.

Observability & alerts
- [ ] Add request-level logs with `x-request-id`, response codes, and latency to centralized logging (ELK/Datadog/CloudWatch).
- [ ] Add metrics export (Prometheus) and alerts for error rate, latency, DB connections, rate-limiter rejections.

Security controls
- [ ] Run dependency vulnerability scans in CI (Snyk/Dependabot/GitHub Actions scanning).
- [ ] Limit outgoing network egress from app instances to only required endpoints (OIDC, vision provider, supabase, etc.).
- [ ] Review image/media handling for size limits and malware scanning on upload.

Operational
- [ ] Add health and readiness probes (already present: `/health` and `/ready`).
- [ ] Configure graceful shutdown and connection draining in the container orchestrator.

Next steps I can take (pick any)
- Implement Prometheus metrics and a `/metrics` endpoint.
- Add Dependabot config or GitHub Actions vulnerability scanning.
- Add a small PR that wires a secrets-check step into CI to fail if required prod env vars are missing.
