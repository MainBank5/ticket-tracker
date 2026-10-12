# Mini Ticket Tracker

A small support-ticket tracker: REST API + database + a single-page UI.

| Part | Stack |
| --- | --- |
| `backend/` | Node.js, Express 5, TypeScript, Prisma, PostgreSQL |
| `frontend/` | Next.js (App Router), React, TypeScript |

## Quick start

Requirements: Node.js 20.19+ and Docker (or your own PostgreSQL 13+).

```bash
# 1. Database + API  (http://localhost:4000)
cd backend
cp .env.example .env
docker compose up -d --wait db     # creates the tickets_dev and tickets_test databases
npm install
npm run migrate
npm run dev

# 2. UI  (http://localhost:3000) — in a second terminal
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The API only accepts browser requests from `http://localhost:3000` by default; change `CORS_ORIGIN` in `backend/.env` if you serve the UI elsewhere, and `NEXT_PUBLIC_API_URL` in `frontend/.env.local` if the API is not on port 4000.

### Tests

```bash
cd backend && npm test
```

Integration tests (13) run the real Express app against a real PostgreSQL test database (`TEST_DATABASE_URL`), covering create, list with filter and pagination, update, stats and validation errors. API reference, project structure and more details: [backend/README.md](backend/README.md).

## Decisions & Tradeoffs

_(Draft )_

- The backend is split into layers per module (routes → controller → service → repository) so HTTP, business rules and data access stay separate; for something this small it is slightly more ceremony than needed, but it shows how new features would slot in.
- Prisma gives typed queries and managed migrations for little code, at the cost of a generate step and a heavier toolchain than plain SQL.
- Requests are validated with zod, and Postgres `CHECK` constraints are a safety net behind it. `status`/`priority` are `TEXT` + `CHECK` rather than native enums (adding a value is a constraint change, not an enum migration); since Prisma doesn't model CHECK constraints they live in the migration SQL.
- Express 5 forwards async errors to the error handler, so controllers have no try/catch, and every error leaves the API in one JSON shape.
- Tickets use UUID primary keys (non-guessable, larger indexes than integers) and snake_case `created_at` in the JSON to match the spec; a small mapper keeps that independent of Prisma's camelCase model.
- Pagination is offset-based (`page`/`limit`) as the spec asks; it slows down on very deep pages, so with more time I'd use keyset pagination on `(created_at, id)`.
- Tests only ever read `TEST_DATABASE_URL` (the app and the Prisma CLI both enforce this under `NODE_ENV=test`) because they truncate tables and must never touch the dev database.
- The UI is one client component using plain `fetch` + `useEffect` instead of SWR/React Query or a global store. After any change it refetches the list and stats rather than updating optimistically: simpler and always correct, at the cost of an extra round trip and no caching. With more time I'd use TanStack Query.
- Styling is plain CSS and there are no frontend tests, to stay within scope; I'd add component tests and a Playwright end-to-end test next.
- Assumptions: new tickets always start as `open`; PATCH only edits status/priority; no auth, delete endpoint or title/description editing, since none were requested. Not done: authentication, rate limiting, structured logging, OpenAPI docs, CI.
