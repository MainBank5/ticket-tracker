# Mini Ticket Tracker — API

REST API for tracking support tickets. Node.js (Express 5) + TypeScript + PostgreSQL via Prisma. The Next.js UI lives in `../frontend`.

## Setup

Requirements: Node.js 20.19+ (built and tested on 22), PostgreSQL 13+ (or Docker).

```bash
cd backend
cp .env.example .env          # defaults match docker-compose below
docker compose up -d db       # PostgreSQL on :5432, creates tickets_dev and tickets_test
npm install                   # also runs `prisma generate` (postinstall)
npm run migrate               # applies prisma/migrations to the dev database
npm run dev                   # http://localhost:4000 (hot reload)
```

Production-style run: `npm run build && npm start`.
Changing `prisma/schema.prisma`? Create a migration with `npm run migrate:dev`.

No Docker? Create two databases (`tickets_dev`, `tickets_test`) in your own Postgres and adjust `DATABASE_URL` / `TEST_DATABASE_URL` in `.env`.

### Tests

```bash
npm test   # applies migrations to the TEST database (pretest), then runs the integration tests
```

Tests run the real Express app against a real PostgreSQL database via supertest. They `TRUNCATE tickets`, so when `NODE_ENV=test` both the app and the Prisma CLI **only** read `TEST_DATABASE_URL` and never `DATABASE_URL`.

Other scripts: `npm run typecheck`.

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
prisma/
  schema.prisma          data model (Ticket)
  migrations/            SQL migrations (init includes the CHECK constraints)
prisma.config.ts         Prisma CLI config (picks the DB URL, same rule as the app)
src/
  server.ts              process entry: listen + graceful shutdown
  app.ts                 builds the Express app (importable by tests)
  config/env.ts          validated environment config
  db/prisma.ts           shared PrismaClient (pg driver adapter)
  common/                AppError types, validate() and error-handling middleware
  modules/tickets/
    tickets.routes.ts      URL -> middleware -> controller
    tickets.schemas.ts     zod request validation (+ inferred input types)
    tickets.controller.ts  HTTP in/out only
    tickets.service.ts     business rules (404s, pagination meta, zero-filled stats)
    tickets.repository.ts  the only file that queries the database (Prisma)
    tickets.mapper.ts      Prisma model -> API response (createdAt -> created_at)
  generated/prisma/      generated client (gitignored, created by `prisma generate`)
tests/                   integration tests
```

New features get their own folder under `modules/` and one `app.use(...)` line in `app.ts`.

## Decisions & Tradeoffs

_(Draft — edit so it reflects your own reasoning before submitting.)_

- Layered modules (routes → controller → service → repository) keep HTTP, business rules and data access separate; for something this small it is slightly more ceremony than needed, but it shows how the codebase would grow.
- Prisma gives typed queries and managed migrations for little code. The tradeoffs are a generate step and a heavier toolchain than plain SQL; for this schema, raw `pg` would also have been fine.
- Request bodies and query strings are validated with zod, and Postgres `CHECK` constraints back that up as a safety net. `status`/`priority` are `TEXT` + `CHECK` instead of native enums (adding a value is a constraint change, not an enum migration). Prisma doesn't model CHECK constraints, so they live in the migration SQL, and the mapper narrows the strings to the `TicketStatus`/`TicketPriority` unions.
- Express 5 forwards async errors to the error handler on its own, so controllers have no try/catch; every error leaves the API in one JSON shape.
- Tickets have UUID primary keys (non-guessable, larger indexes than an integer), and the JSON uses snake_case `created_at` to match the spec. A small mapper keeps that API shape independent of Prisma's camelCase model.
- Pagination is offset-based (`page`/`limit`) as the spec asks; it is simple but slows down on very deep pages. With more time I'd use keyset pagination on `(created_at, id)`.
- When `NODE_ENV=test`, the app and the Prisma CLI only read `TEST_DATABASE_URL`, because the tests `TRUNCATE` tables and must never be able to touch the dev database.
- Assumptions: new tickets always start as `open` (so `status` is rejected on create); PATCH only edits status/priority; no auth, no delete endpoint, no editing of title/description, since none were requested.
- Not done: authentication, rate limiting, structured logging, OpenAPI docs, CI, and tests for DB failure paths.
