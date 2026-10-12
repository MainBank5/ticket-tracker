# Mini Ticket Tracker — API

REST API for tracking support tickets. Node.js (Express 5) + PostgreSQL. The Next.js UI lives in `../frontend`.

## Setup

Requirements: Node.js 20+ (built and tested on 22), PostgreSQL 13+ (or Docker).

```bash
cd backend
cp .env.example .env          # defaults match docker-compose below
docker compose up -d db       # PostgreSQL on :5432, creates tickets_dev and tickets_test
npm install
npm run migrate               # applies migrations/*.sql to the dev database
npm run dev                   # http://localhost:4000  (npm start for non-watch)
```

No Docker? Create two databases (`tickets_dev`, `tickets_test`) in your own Postgres and adjust `DATABASE_URL` / `TEST_DATABASE_URL` in `.env`.

### Tests

```bash
npm test   # integration tests against TEST_DATABASE_URL (migrates it automatically)
```

Tests run the real Express app against a real PostgreSQL database via supertest. They `TRUNCATE tickets`, so when `NODE_ENV=test` the app **only** reads `TEST_DATABASE_URL` and never `DATABASE_URL`.

## API

All bodies are JSON. Success responses are wrapped in `{ "data": ... }`; errors always look like `{ "error": { "code", "message", "details?" } }`.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/tickets` | Create. Body: `title` (required, ≤200), `description` (optional, ≤5000), `priority` (`low\|medium\|high`, default `medium`). Status starts as `open`. → `201` |
| GET | `/tickets` | List, newest first. Query: `status` (`open\|in_progress\|closed`), `page` (default 1), `limit` (default 20, max 100). → `{ data: [...], meta: { page, limit, total, total_pages } }` |
| PATCH | `/tickets/:id` | Update `status` and/or `priority` (at least one; other fields rejected). `404` if not found. |
| GET | `/tickets/stats` | `{ data: { open, in_progress, closed, total } }` (zero-filled) |
| GET | `/health` | Liveness + DB connectivity |

Ticket shape: `{ id (uuid), title, description (string|null), status, priority, created_at (ISO 8601) }`.

```bash
curl -X POST localhost:4000/tickets -H 'content-type: application/json' \
  -d '{"title":"Login broken","priority":"high"}'
curl "localhost:4000/tickets?status=open&page=1&limit=10"
curl -X PATCH localhost:4000/tickets/<id> -H 'content-type: application/json' -d '{"status":"in_progress"}'
curl localhost:4000/tickets/stats
```

## Project structure

```
src/
  server.js              process entry: listen + graceful shutdown
  app.js                 builds the Express app (importable by tests)
  config/env.js          validated environment config
  db/                    pg pool + tiny SQL migration runner
  common/                AppError types, validate() and error-handling middleware
  modules/tickets/
    tickets.routes.js      URL -> middleware -> controller
    tickets.schemas.js     zod request validation
    tickets.controller.js  HTTP in/out only
    tickets.service.js     business rules (404s, pagination meta, zero-filled stats)
    tickets.repository.js  the only file with SQL
migrations/              ordered *.sql files
tests/                   integration tests
```

New features get their own folder under `modules/` and one `app.use(...)` line in `app.js`.

## Decisions & Tradeoffs

_(Draft — edit so it reflects your own reasoning before submitting.)_

- Layered modules (routes → controller → service → repository) keep HTTP, business rules and SQL separate; for something this small it is slightly more ceremony than needed, but it shows how the codebase would grow.
- I used plain `pg` with parameterised SQL instead of an ORM: the queries are trivial, and it avoids a heavy dependency. With more models I'd reconsider Prisma/Drizzle.
- Status and priority are `TEXT` + `CHECK` constraints rather than native Postgres enums, because adding a value later is a simple constraint change rather than an enum migration. Validation happens in zod first, and the DB constraints are the safety net.
- Primary keys are UUIDs (non-guessable ids, no coordination needed); the cost is larger indexes than an integer key.
- Pagination is offset-based (`page`/`limit`) as the spec asks; it is simple but gets slower on very deep pages. With more time I'd use keyset pagination on `(created_at, id)`.
- Migrations are a ~40-line forward-only runner (no rollbacks, no locking). A real project should use a tool such as node-pg-migrate or Flyway.
- Assumptions: new tickets always start as `open` (so `status` is rejected on create); PATCH only edits status/priority; no auth, no delete endpoint, no editing of title/description, since none were requested.
- Not done: authentication, rate limiting, structured logging, OpenAPI docs, CI, and tests for the DB failure paths.
