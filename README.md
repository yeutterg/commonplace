# Obsidian Comments

This repo is now structured as a hybrid system:

- `apps/web`: a Vercel-safe Next.js frontend
- `apps/api`: a Docker-oriented backend that reads an Obsidian-compatible vault and persists comments/session state
- `packages/shared`: shared TypeScript contracts between the web app and the API

The important architectural decision is that the web app no longer reads or writes the vault directly. The backend owns vault access, comments, auth cookies, and future sync/collaboration responsibilities.

## Current shape

- Notes are loaded from a filesystem vault adapter in `apps/api`
- Notes are assigned stable app-level IDs through a small registry in SQLite
- Comments are stored in SQLite under a durable state directory
- Protected note access is handled by backend-issued cookies
- The frontend renders notes and comments by calling the backend API
- A websocket endpoint exists as a stub for future collaborative editing

## Workspace layout

```text
apps/
  api/        Express API, vault adapter, SQLite comment store
  web/        Next.js UI for browsing and reviewing notes
packages/
  shared/     Shared API types
infra/
  docker/     Dockerfiles for the API and web app
```

## Local development

Install dependencies:

```bash
npm install
```

Run the API:

```bash
npm run dev:api
```

Run the web app:

```bash
npm run dev:web
```

Run tests:

```bash
npm test
```

By default:

- web: `http://localhost:3000`
- api: `http://localhost:4000`

## Environment

Frontend env:

- `API_BASE_URL`: server-side URL used by Next.js when fetching the API
- `NEXT_PUBLIC_API_BASE_URL`: browser-visible API base URL

Backend env:

- `PORT`: API port
- `VAULT_DIR`: mounted Obsidian vault or published vault subset
- `STATE_DIR`: persistent directory for SQLite and future sync state
- `CORS_ORIGIN`: allowed frontend origin
- `SESSION_SECRET`: cookie signing secret
- `SESSION_MAX_AGE_DAYS`: session lifetime before re-authentication
- `COOKIE_DOMAIN`: optional cookie domain for shared deployments
- `COOKIE_SAME_SITE`: `lax`, `strict`, or `none`

See:

- [apps/web/.env.example](/Users/greg/WIP/obsidian-comments/app/apps/web/.env.example)
- [apps/api/.env.example](/Users/greg/WIP/obsidian-comments/app/apps/api/.env.example)

## Docker

Run the full stack locally:

```bash
docker compose up --build
```

The compose file mounts `./apps/web/content` as the example vault. Replace that bind mount with a real Obsidian vault path when you are ready.

## Deployment model

Recommended split:

- Deploy `apps/web` to Vercel
- Deploy `apps/api` anywhere Docker is appropriate (VPS, Fly, Railway, Render, ECS, k8s)

The web app only needs the API URL. The backend needs durable storage and vault access.

## Long-term direction

This layout is intended to grow into a collaborative markdown editor.

The backend is the right place for:

- document metadata
- stable note identity
- durable comment storage
- future version history
- vault sync/import/export
- websocket collaboration

The vault adapter boundary is already isolated so you can add:

- mounted local vaults
- Git-backed vault sync
- remote storage adapters
- Obsidian CLI wrappers if they turn out to be useful
