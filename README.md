# Monitoring Platform

Bachelor’s project: a small Iranian-style monitoring SaaS (host metrics like Datadog + website checks like UptimeRobot).

## Architecture

```
Windows/Linux host                 Backend                         Browser
─────────────────                  ───────                         ───────
.NET 8 Agent  --POST /metrics-->  NestJS API  <--JWT REST/WS--  React dashboard
(CPU, RAM, disk)   X-Api-Key      PostgreSQL
every 30s                         Socket.IO rooms per organization
```

| Part | Path | Role |
|------|------|------|
| Agent | `MonitoringAgent/` | Collects OS metrics and posts them with the org API key |
| API | `MonitoringPlatform/monitoring-backend/` | Auth, orgs, metrics, alerts, uptime checks, Telegram |
| UI | `MonitoringPlatform/monitoring-frontend/` | Persian RTL dashboard |
| Compose | `MonitoringPlatform/docker-compose.yml` | Postgres + API + UI (+ optional demo agent profile) |

## Features

- Per-organization login (JWT) and shared dashboards
- Agent API key (`X-Api-Key`) scoped to the active organization
- Live CPU / RAM / disk charts over WebSocket
- Multi-host picker when several agents report different machine names
- HTTP(S) uptime monitors with scheduled checks (SSRF-safe URL policy)
- Threshold alerts (CPU / RAM / disk / site down) with cooldown
- Operators can acknowledge or resolve alerts from the dashboard
- Optional Telegram delivery (`TELEGRAM_BOT_TOKEN` + per-user chat ID)
- Organization members: owners invite existing accounts by email

## Prerequisites

- Docker Desktop (recommended for full-stack demo)
- Node.js 20+ and .NET 8 SDK (only if you develop API/UI/agent outside Docker)
- On Windows, use Docker context `default` for local work (`docker context use default`)

## Quick start

### Option A — full stack in Docker (recommended for demo)

```powershell
cd C:\Users\sysadmin\Desktop\Monitoring\MonitoringPlatform
copy .env.example .env
# Edit .env: set POSTGRES_PASSWORD and JWT_SECRET
docker compose up -d --build
```

Open the dashboard at `http://localhost:5173` and the API at `http://localhost:3000/health`.

**Start the optional demo agent container** (reports container metrics — good for a quick demo):

1. Register in the dashboard and copy the org agent key (**کلید ایجنت**).
2. Paste the key into `.env` as `AGENT_API_KEY=mon_...`
3. Run:

```powershell
docker compose --profile demo up -d --build agent
```

The agent posts to `http://api:3000/` inside the compose network. Override the displayed host name with `AGENT_MACHINE_NAME` in `.env`.

**Real host monitoring:** run the .NET agent on Windows/Linux outside Docker (see [Option B → Agent](#6-agent-real-host-monitoring)). That reports actual OS CPU/RAM/disk, not container limits.

### Option B — local development (Postgres in Docker, API/UI on the host)

#### 1. Environment files

```powershell
cd C:\Users\sysadmin\Desktop\Monitoring\MonitoringPlatform
copy .env.example .env

cd monitoring-backend
copy .env.example .env

cd ..\monitoring-frontend
copy .env.example .env
```

Edit passwords and `JWT_SECRET` in the backend `.env`. Postgres values in `MonitoringPlatform/.env` and `monitoring-backend/.env` must match.

#### 2. Database

**Postgres only (typical local Nest/Vite workflow):**

```powershell
cd C:\Users\sysadmin\Desktop\Monitoring\MonitoringPlatform
docker compose up -d postgres
```

To run only Postgres + API (develop the UI with Vite locally):

```powershell
docker compose up -d --build postgres api
```

#### 3. API (local Node, if not using the `api` container)

```powershell
cd C:\Users\sysadmin\Desktop\Monitoring\MonitoringPlatform\monitoring-backend
npm install
npm run start:dev
```

API: `http://localhost:3000`

#### 4. Dashboard (local Vite, if not using the `web` container)

```powershell
cd C:\Users\sysadmin\Desktop\Monitoring\MonitoringPlatform\monitoring-frontend
npm install
npm run dev
```

UI: `http://localhost:5173`

#### 5. Register and copy the agent key

1. Open the dashboard → **ثبت‌نام**
2. Click **کلید ایجنت** and copy the key (belongs to the active organization)
3. Either:
   - set `AGENT_API_KEY` in `MonitoringPlatform/.env` and use `docker compose --profile demo up -d agent`, or
   - paste into `MonitoringAgent/appsettings.json`:

```json
"MonitoringApi": {
  "BaseUrl": "http://localhost:3000/",
  "ApiKey": "mon_...",
  "MachineName": "my-laptop"
}
```

Leave `MachineName` empty to use the OS hostname automatically.

#### 6. Agent (real host monitoring)

```powershell
cd C:\Users\sysadmin\Desktop\Monitoring\MonitoringAgent
dotnet run
```

Within about 30 seconds, metrics should appear on the dashboard.

## Demo script (≈5 minutes)

1. Show register/login and the org switcher in the header.
2. Start the agent → live cards and chart update.
3. Add a public uptime target (for example `https://google.com`) under **پایش دسترس‌پذیری سایت**.
4. (Optional) Set Telegram bot token + chat ID → send a test message.
5. Invite a second registered user under **سازمان و اعضا** and show shared data.
6. If two agents run with different machine names, use **سرور هدف** to switch hosts.

## Important API surfaces

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/auth/register`, `/auth/login` | Public |
| `GET` | `/auth/me` | JWT |
| `POST` | `/metrics` | `X-Api-Key` |
| `GET` | `/metrics?machineName=&limit=`, `/metrics/hosts`, `/alerts` | JWT + `X-Organization-Id` |
| `GET/POST/DELETE` | `/monitors` | JWT + org |
| `GET/POST/DELETE` | `/organizations...` | JWT + org |
| `GET/PATCH/POST` | `/notifications/telegram...` | JWT |

Dashboard requests send `Authorization: Bearer …` and `X-Organization-Id`.

## Telegram (optional)

1. Create a bot with `@BotFather` and set `TELEGRAM_BOT_TOKEN` in the backend `.env`.
2. Restart the API.
3. Start a chat with the bot, get your numeric chat ID, save it on the dashboard, send a test message.

## Project layout (backend / frontend conventions)

- Nest: `modules` / `controller` / `service` / `dto` / `entity` / `guard`
- React: `pages` / `components` / `hooks` / `api`
- Agent: Worker orchestrates; collectors and HTTP transport are separate

## Notes for reviewers

- Local development uses TypeORM `synchronize=true`. Do **not** enable that against a real shared database.
- Never commit real `.env` files; only `.env.example` belongs in git.
- Uptime checks block localhost and private IP ranges on purpose (SSRF protection).
- Backend unit tests: `cd monitoring-backend && npm test`
- Optional Postgres e2e: `cd monitoring-backend`, set `RUN_E2E=1`, then `npm run test:e2e`
- Before a real deploy, follow [docs/PRODUCTION.md](docs/PRODUCTION.md) (secrets, `DB_SYNCHRONIZE=false`, CORS, TLS).

## License

UNLICENSED — academic / private project.
