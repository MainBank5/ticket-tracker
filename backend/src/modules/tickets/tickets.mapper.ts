import type { Ticket } from '../../generated/prisma/client.js';
import type { TicketPriority, TicketStatus } from './tickets.constants.js';

/** The public API shape of a ticket */
export interface TicketResponse {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
}


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
