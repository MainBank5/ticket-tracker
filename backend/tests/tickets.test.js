import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { pool } from '../src/db/pool.js';

// Integration tests: real Express app + real PostgreSQL (TEST_DATABASE_URL).
const app = createApp();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const createTicket = (body) => request(app).post('/tickets').send(body);

before(async () => {
  await runMigrations();
});

beforeEach(async () => {
  await pool.query('TRUNCATE tickets');
});

after(async () => {
  await pool.end();
});

describe('POST /tickets', () => {
  it('creates a ticket with defaults (status=open, priority=medium)', async () => {
    const res = await createTicket({ title: '  Printer on fire  ' });

    assert.equal(res.status, 201);
    assert.match(res.body.data.id, UUID_RE);
    assert.equal(res.body.data.title, 'Printer on fire'); // trimmed
    assert.equal(res.body.data.description, null);
    assert.equal(res.body.data.status, 'open');
    assert.equal(res.body.data.priority, 'medium');
    assert.ok(!Number.isNaN(Date.parse(res.body.data.created_at)));
  });

  it('accepts description and priority', async () => {
    const res = await createTicket({ title: 'VPN down', description: 'Cannot connect', priority: 'high' });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.description, 'Cannot connect');
    assert.equal(res.body.data.priority, 'high');
  });

  it('rejects invalid input with a 400 and field details', async () => {
    const res = await createTicket({ title: '   ', priority: 'urgent', status: 'closed' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.length >= 2);
    assert.ok(res.body.error.details.some((d) => d.path === 'title'));
    assert.ok(res.body.error.details.some((d) => d.path === 'priority'));
  });

  it('rejects malformed JSON with a 400', async () => {
    const res = await request(app).post('/tickets').set('Content-Type', 'application/json').send('{"title":');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_JSON');
  });
});

describe('GET /tickets', () => {
  it('lists newest first with pagination metadata', async () => {
    for (let i = 1; i <= 5; i++) await createTicket({ title: `Ticket ${i}` });

    const page1 = await request(app).get('/tickets?page=1&limit=2');
    assert.equal(page1.status, 200);
    assert.deepEqual(page1.body.data.map((t) => t.title), ['Ticket 5', 'Ticket 4']);
    assert.deepEqual(page1.body.meta, { page: 1, limit: 2, total: 5, total_pages: 3 });

    const page3 = await request(app).get('/tickets?page=3&limit=2');
    assert.deepEqual(page3.body.data.map((t) => t.title), ['Ticket 1']);

    const beyond = await request(app).get('/tickets?page=9&limit=2');
    assert.equal(beyond.status, 200);
    assert.deepEqual(beyond.body.data, []);
    assert.equal(beyond.body.meta.total, 5);
  });

  it('filters by status', async () => {
    const a = await createTicket({ title: 'A' });
    await createTicket({ title: 'B' });
    await request(app).patch(`/tickets/${a.body.data.id}`).send({ status: 'closed' });

    const res = await request(app).get('/tickets?status=closed');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].title, 'A');
    assert.equal(res.body.meta.total, 1);
  });

  it('rejects an invalid status or out-of-range pagination', async () => {
    for (const qs of ['status=bogus', 'page=0', 'limit=1000', 'limit=abc']) {
      const res = await request(app).get(`/tickets?${qs}`);
      assert.equal(res.status, 400, qs);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
  });
});

describe('PATCH /tickets/:id', () => {
  it('updates status and priority', async () => {
    const { body } = await createTicket({ title: 'Update me' });

    const res = await request(app).patch(`/tickets/${body.data.id}`).send({ status: 'in_progress', priority: 'low' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'in_progress');
    assert.equal(res.body.data.priority, 'low');
    assert.equal(res.body.data.title, 'Update me');
  });

  it('returns 404 for an unknown id and 400 for a malformed id', async () => {
    const missing = await request(app).patch('/tickets/6f1c2b9e-3c1a-4f4e-9d0a-1b2c3d4e5f60').send({ status: 'closed' });
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error.code, 'NOT_FOUND');

    const malformed = await request(app).patch('/tickets/123').send({ status: 'closed' });
    assert.equal(malformed.status, 400);
  });

  it('rejects empty bodies, invalid values and non-editable fields', async () => {
    const { body } = await createTicket({ title: 'Strict' });
    for (const payload of [{}, { status: 'done' }, { title: 'Renamed' }]) {
      const res = await request(app).patch(`/tickets/${body.data.id}`).send(payload);
      assert.equal(res.status, 400, JSON.stringify(payload));
    }
  });
});

describe('GET /tickets/stats', () => {
  it('returns zero counts when there are no tickets', async () => {
    const res = await request(app).get('/tickets/stats');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, { open: 0, in_progress: 0, closed: 0, total: 0 });
  });

  it('counts tickets grouped by status', async () => {
    const ids = [];
    for (const title of ['1', '2', '3', '4']) ids.push((await createTicket({ title })).body.data.id);
    await request(app).patch(`/tickets/${ids[0]}`).send({ status: 'closed' });
    await request(app).patch(`/tickets/${ids[1]}`).send({ status: 'closed' });
    await request(app).patch(`/tickets/${ids[2]}`).send({ status: 'in_progress' });

    const res = await request(app).get('/tickets/stats');
    assert.deepEqual(res.body.data, { open: 1, in_progress: 1, closed: 2, total: 4 });
  });
});

describe('misc', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/nope');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'ROUTE_NOT_FOUND');
  });
});
