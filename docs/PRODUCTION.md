# Production checklist

This project is demo-ready with TypeORM `synchronize` and local Docker. Before any shared or public deploy, treat the notes below as required.

## Secrets

- [ ] Generate a long random `JWT_SECRET` (do not reuse the example value)
- [ ] Change `POSTGRES_PASSWORD` from the example password
- [ ] Keep real `.env` files out of git (only `.env.example` is committed)
- [ ] If Telegram is enabled, store `TELEGRAM_BOT_TOKEN` only in server env, never in the frontend
- [ ] Rotate organization agent API keys if they were ever pasted into chat, screenshots, or public repos

## Database

- [ ] Set `DB_SYNCHRONIZE=false` in production
- [ ] Create schema with an explicit migration workflow (TypeORM migrations or SQL scripts) before first deploy
- [ ] Take backups of Postgres before schema changes
- [ ] Do not point a synchronized local app at a shared database volume

Local/demo Compose may keep `DB_SYNCHRONIZE=true` so entities create tables automatically. That is convenient for a bachelor demo and unsafe for a multi-user production database.

## Network and CORS

- [ ] Set `CORS_ORIGIN` to the real dashboard origin(s), comma-separated if needed
- [ ] Publish only needed ports; keep Postgres off the public internet when possible
- [ ] Terminate TLS in front of the API/UI (reverse proxy / cloud load balancer)
- [ ] Confirm uptime checks still cannot target private IPs (SSRF policy is intentional)

## Runtime

- [ ] Run API with `NODE_ENV=production` and `npm run start:prod` (or the Docker `api` image)
- [ ] Give the API a restart policy (Compose `restart: unless-stopped` or process manager)
- [ ] Monitor disk for Postgres volume growth (metrics and check history accumulate)
- [ ] Keep alert thresholds and `ALERT_COOLDOWN_MINUTES` tuned to reduce noise

## Agent hosts

- [ ] Each monitored machine uses the **organization** API key from the dashboard
- [ ] Point `MonitoringApi:BaseUrl` at the public HTTPS API URL
- [ ] Use distinct OS hostnames (or configure machine names) so the host picker stays useful

## Suggested migration path (when leaving synchronize)

1. Freeze entity changes.
2. Enable TypeORM migrations in the Nest project.
3. Generate an initial migration from the current schema.
4. Deploy with `DB_SYNCHRONIZE=false` and `migration:run` on startup or in CI.
5. Never re-enable synchronize against that database.

Until then, treat synchronize as a **local/demo only** switch.
