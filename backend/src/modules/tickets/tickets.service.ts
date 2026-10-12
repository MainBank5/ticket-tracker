import { NotFoundError } from '../../common/errors.js';
import type { TicketStatus } from './tickets.constants.js';
import { toTicketResponse, type TicketResponse } from './tickets.mapper.js';
import * as repository from './tickets.repository.js';
import type { CreateTicketInput, ListTicketsQuery, UpdateTicketInput } from './tickets.schemas.js';

export interface TicketListResult {
  items: TicketResponse[];
  meta: { page: number; limit: number; total: number; total_pages: number };
}

export type TicketStats = Record<TicketStatus, number> & { total: number };

export async function createTicket(input: CreateTicketInput): Promise<TicketResponse> {
  return toTicketResponse(await repository.insert(input));
}

export async function listTickets({ status, page, limit }: ListTicketsQuery): Promise<TicketListResult> {
  const { items, total } = await repository.findPage({ status, limit, offset: (page - 1) * limit });
  return {
    items: items.map(toTicketResponse),
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function updateTicket(id: string, changes: UpdateTicketInput): Promise<TicketResponse> {
  const ticket = await repository.updateById(id, changes);
  if (!ticket) throw new NotFoundError('Ticket');
  return toTicketResponse(ticket);
}

// Always returns every status (zero-filled) so clients don't need to handle missing keys.
// Typing the object as Record<TicketStatus, number> makes the compiler flag it if a status is added.
export async function getStats(): Promise<TicketStats> {
  const byStatus: Record<TicketStatus, number> = { open: 0, in_progress: 0, closed: 0 };
  for (const { status, count } of await repository.countByStatus()) {
    if (status in byStatus) byStatus[status as TicketStatus] = count;
  }
  return { ...byStatus, total: byStatus.open + byStatus.in_progress + byStatus.closed };
}
