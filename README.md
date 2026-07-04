# Quest app

Standalone HABBIT Quest Hub built with React, Vite, Express, and Postgres.

## Local development

```bash
npm install
npm run dev:full
```

The Vite app runs on `http://localhost:3000` and proxies `/api/*` to the Express API on `http://localhost:3001`.

## Docker

```bash
docker compose up --build
```

Docker builds the Vite app, serves it from Express, and starts Postgres with `db/init.sql`. Open `http://localhost:3001`.

## Database

`db/init.sql` creates:

- `quests`: persisted quest definitions and completion state.
- `quest_events`: reward ledger rows written when a quest is completed.
- `collectible_unlocks`: account-scoped sticker assets shown in the gallery.

Without `DATABASE_URL`, the API serves starter quests and the UI clearly reports local-only quest, reward, and gallery state.

## Verification

```bash
npm run test:ci
npm run build
docker build -t quests-app-ci .
```
