// Mirrors the backend's response shapes (see backend/src/modules/tickets).

export const TICKET_STATUSES = ['open', 'in_progress', 'closed'] as const;
export const TICKET_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string; // ISO 8601
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface TicketPage {
  data: Ticket[];
  meta: PageMeta;
}

export type TicketStats = Record<TicketStatus, number> & { total: number };

export interface NewTicket {
  title: string;
  description?: string;
  priority: TicketPriority;
}
