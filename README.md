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
| DB | Docker Compose Postgres | Persistence |

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

- Node.js 20+ (LTS recommended)
- .NET 8 SDK (for the agent)
- Docker Desktop (Postgres)
- On Windows, use Docker context `default` for local work (`docker context use default`)

## Quick start

### 1. Environment files

```powershell
cd C:\Users\sysadmin\Desktop\Monitoring\MonitoringPlatform
copy .env.example .env

cd monitoring-backend
copy .env.example .env

cd ..\monitoring-frontend
copy .env.example .env
```

Edit passwords and `JWT_SECRET` in the backend `.env`. Postgres values in `MonitoringPlatform/.env` and `monitoring-backend/.env` must match.

### 2. Database (or full stack with Docker)

**Postgres only (typical local Nest/Vite workflow):**

```powershell
cd C:\Users\sysadmin\Desktop\Monitoring\MonitoringPlatform
docker compose up -d postgres
```

**API + dashboard + Postgres in Docker:**

```powershell
cd C:\Users\sysadmin\Desktop\Monitoring\MonitoringPlatform
copy .env.example .env
# set JWT_SECRET and POSTGRES_PASSWORD in .env
docker compose up -d --build
```

Then open `http://localhost:5173` (web) and `http://localhost:3000` (API).  
The agent still runs on the host with `dotnet run` and posts to `http://localhost:3000/`.

To run only Postgres + API (develop the UI with Vite locally):

```powershell
docker compose up -d --build postgres api
```

### 3. API (local Node, if not using the `api` container)

```powershell
cd C:\Users\sysadmin\Desktop\Monitoring\MonitoringPlatform\monitoring-backend
npm install
npm run start:dev
```

API: `http://localhost:3000`

### 4. Dashboard (local Vite, if not using the `web` container)

```powershell
cd C:\Users\sysadmin\Desktop\Monitoring\MonitoringPlatform\monitoring-frontend
npm install
npm run dev
```

UI: `http://localhost:5173`

### 5. Register and copy the agent key

1. Open the dashboard → **ثبت‌نام**
2. Click **کلید ایجنت** and copy the key (belongs to the active organization)
3. Paste into `MonitoringAgent/appsettings.json`:

```json
"MonitoringApi": {
  "BaseUrl": "http://localhost:3000/",
  "ApiKey": "mon_..."
}
```

### 6. Agent

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
| `GET` | `/metrics`, `/metrics/hosts`, `/alerts` | JWT + `X-Organization-Id` |
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

## License

UNLICENSED — academic / private project.
