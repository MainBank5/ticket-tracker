import type { Ticket } from '../../generated/prisma/client.js';
import type { TicketPriority, TicketStatus } from './tickets.constants.js';

/** The public API shape of a ticket (snake_case, matching the assignment's data model). */
export interface TicketResponse {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
}

// Keeps the API contract independent of the Prisma model (createdAt -> created_at).
// status/priority are TEXT in Prisma; the CHECK constraints guarantee the values, so
// narrowing them to the union types here is safe.
export function toTicketResponse(ticket: Ticket): TicketResponse {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status as TicketStatus,
    priority: ticket.priority as TicketPriority,
    created_at: ticket.createdAt.toISOString(),
  };
}
