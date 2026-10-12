import type { NewTicket, Ticket, TicketPage, TicketPriority, TicketStats, TicketStatus } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// The API always answers errors as { error: { code, message, details? } }.
function describeError(body: unknown): string | undefined {
  const error = (body as { error?: { message?: string; details?: { path: string; message: string }[] } } | null)?.error;
  if (!error) return undefined;
  if (error.details?.length) {
    return error.details.map((d) => (d.path ? `${d.path}: ${d.message}` : d.message)).join('; ');
  }
  return error.message;
}

async function request<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: init.method ?? 'GET',
      // Only send Content-Type when there is a body: on GETs it would force a CORS preflight.
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
      cache: 'no-store',
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the API. Is the backend running?', 0);
  }

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(describeError(body) ?? `Request failed (${res.status})`, res.status);
  return body as T;
}

export function listTickets(
  params: { status?: TicketStatus; page: number; limit: number },
  signal?: AbortSignal,
): Promise<TicketPage> {
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
  if (params.status) query.set('status', params.status);
  return request<TicketPage>(`/tickets?${query}`, { signal });
}

export async function getStats(signal?: AbortSignal): Promise<TicketStats> {
  return (await request<{ data: TicketStats }>('/tickets/stats', { signal })).data;
}

export async function createTicket(input: NewTicket): Promise<Ticket> {
  const body = { ...input, description: input.description?.trim() || undefined };
  return (await request<{ data: Ticket }>('/tickets', { method: 'POST', body })).data;
}

export async function updateTicket(
  id: string,
  changes: { status?: TicketStatus; priority?: TicketPriority },
): Promise<Ticket> {
  return (await request<{ data: Ticket }>(`/tickets/${id}`, { method: 'PATCH', body: changes })).data;
}
