import { NotFoundError } from '../../common/errors.js';
import { TICKET_STATUSES } from './tickets.constants.js';
import * as repository from './tickets.repository.js';

export function createTicket(input) {
  return repository.insert(input);
}

export async function listTickets({ status, page, limit }) {
  const { items, total } = await repository.findPage({ status, limit, offset: (page - 1) * limit });
  return {
    items,
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function updateTicket(id, changes) {
  const ticket = await repository.updateById(id, changes);
  if (!ticket) throw new NotFoundError('Ticket');
  return ticket;
}

// Always returns every status (zero-filled) so clients don't need to handle missing keys.
export async function getStats() {
  const rows = await repository.countByStatus();
  const byStatus = Object.fromEntries(TICKET_STATUSES.map((s) => [s, 0]));
  for (const { status, count } of rows) byStatus[status] = count;
  return { ...byStatus, total: Object.values(byStatus).reduce((a, b) => a + b, 0) };
}
