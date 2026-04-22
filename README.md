# GG Arena (V1 Beta)

Monorepo: Telegram Mini App (`frontend/`), referee web panel (`referee-dashboard/`), API (`backend/`), and Telegram bot (`bot/`). Stack: React + Vite, Express + Prisma + PostgreSQL + Redis + Bull + Socket.io.

## Prerequisites

- Docker and Docker Compose
- Telegram bot token (BotFather)
- Steam Web API key (optional for stats)
- Google Cloud project with Vision + Vertex AI + optional GCS (optional for OCR; without keys OCR falls back to low-confidence flow)

## Quick start

1. Copy environment file:

   `cp .env.example .env`

2. Set at minimum: `BOT_TOKEN`, `JWT_SECRET` (random string), `DATABASE_URL` / `REDIS_URL` matching compose defaults if unchanged.

3. Start databases and API:

   `docker compose up -d postgres redis`

4. Run migrations (from host, with DB reachable):

   `cd backend && DATABASE_URL=postgresql://ggarena:ggarena@localhost:5432/ggarena npx prisma migrate deploy`

5. Start full stack:

   `docker compose up -d`

6. Apply migrations inside backend container if you prefer:

   `docker compose exec backend npx prisma migrate deploy`

## URLs (default compose)

- API: `http://localhost:3001`
- Mini App (Vite preview in container): `http://localhost:5173`
- Referee dashboard: `http://localhost:5174/referee/`
- Postgres: `localhost:5432`, Redis: `localhost:6379`

Set `FRONTEND_URL` to your **HTTPS** Mini App URL for production. Register the same domain in BotFather for Web Apps.

## Auth

- Mini App: `POST /auth/telegram` with `{ initData }` from `Telegram.WebApp.initData` (HMAC validated with bot token).
- Referee panel: Telegram Login Widget → `POST /auth/telegram-web` with widget payload; user must have `isReferee` or `isAdmin` in DB (`/admin setreferee` via bot for admins).

## Admin Telegram IDs

Comma-separated numeric IDs in `ADMIN_TELEGRAM_IDS`. Matching users receive `isAdmin` on each Mini App login. Bot commands `/admin …` are restricted to the same list.

## Build-time Vite variables

`VITE_API_BASE_URL` and `VITE_WS_URL` must be reachable from the **browser** (use your public API host in production). `VITE_TELEGRAM_BOT_USERNAME` is the bot username **without** `@` for the referee Login Widget.

## GCP OCR

Mount a service account JSON and set `GCP_KEY_FILE` (path inside container), `GCP_PROJECT_ID`, optionally `GCP_LOCATION` and `GEMINI_MODEL`. Set `API_PUBLIC_URL` so screenshot URLs in `MatchResult` resolve for referees.

## License

Private / your policy.
