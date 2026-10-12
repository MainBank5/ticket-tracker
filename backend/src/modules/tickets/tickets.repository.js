import { pool } from '../../db/pool.js';

// The only place that knows SQL / table layout for tickets.
const COLUMNS = 'id, title, description, status, priority, created_at';
const UPDATABLE_COLUMNS = ['status', 'priority']; // whitelist for dynamic SET

export async function insert({ title, description, priority }) {
  const { rows } = await pool.query(
    `INSERT INTO tickets (title, description, priority)
     VALUES ($1, $2, $3)
     RETURNING ${COLUMNS}`,
    [title, description ?? null, priority],
  );
  return rows[0];
}

export async function findPage({ status, limit, offset }) {
  const where = status ? 'WHERE status = $1' : '';
  const params = status ? [status] : [];

  const [items, count] = await Promise.all([
    pool.query(
      `SELECT ${COLUMNS} FROM tickets ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM tickets ${where}`, params),
  ]);

  return { items: items.rows, total: count.rows[0].total };
}

export async function updateById(id, fields) {
  const columns = UPDATABLE_COLUMNS.filter((c) => fields[c] !== undefined);
  const setClause = columns.map((c, i) => `${c} = $${i + 2}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE tickets SET ${setClause} WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, ...columns.map((c) => fields[c])],
  );
  return rows[0] ?? null;
}

export async function countByStatus() {
  const { rows } = await pool.query('SELECT status, COUNT(*)::int AS count FROM tickets GROUP BY status');
  return rows;
}
