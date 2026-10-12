import { PRIORITY_LABELS, STATUS_LABELS, TICKET_STATUSES, type Ticket, type TicketStatus } from '@/lib/types';

interface Props {
  tickets: Ticket[];
  updatingId: string | null;
  onStatusChange: (ticket: Ticket, status: TicketStatus) => void;
}

export function TicketList({ tickets, updatingId, onStatusChange }: Props) {
  if (tickets.length === 0) return <p className="muted empty">No tickets here yet.</p>;

  return (
    <ul className="tickets">
      {tickets.map((ticket) => (
        <li key={ticket.id} className="card ticket">
          <div className="ticket-main">
            <h3>{ticket.title}</h3>
            {ticket.description && <p>{ticket.description}</p>}
            <p className="muted small">
              <span className={`badge priority-${ticket.priority}`}>{PRIORITY_LABELS[ticket.priority]} priority</span>{' '}
              · {new Date(ticket.created_at).toLocaleString()}
            </p>
          </div>

          <select
            aria-label={`Status of ${ticket.title}`}
            className={`status status-${ticket.status}`}
            value={ticket.status}
            disabled={updatingId === ticket.id}
            onChange={(e) => onStatusChange(ticket, e.target.value as TicketStatus)}
          >
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </li>
      ))}
    </ul>
  );
}
