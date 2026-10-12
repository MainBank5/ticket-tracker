'use client';

import { useEffect, useState } from 'react';
import { ApiError, getStats, listTickets, updateTicket } from '@/lib/api';
import type { Ticket, TicketPage, TicketStats, TicketStatus } from '@/lib/types';
import { Pagination } from './Pagination';
import { StatusFilter, type Filter } from './StatusFilter';
import { TicketForm } from './TicketForm';
import { TicketList } from './TicketList';

const PAGE_SIZE = 10;

function messageOf(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong';
}

// Owns all server state for the page: the current filter/page, the loaded data, and refetching.
export function TicketBoard() {
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState<TicketPage | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0); // bump to refetch

  const refresh = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    Promise.all([
      listTickets({ status: filter === 'all' ? undefined : filter, page, limit: PAGE_SIZE }, controller.signal),
      getStats(controller.signal),
    ])
      .then(([pageData, statsData]) => {
        // The last ticket on the last page moved away (e.g. status changed under a filter): step back.
        if (pageData.data.length === 0 && page > 1) {
          setPage(Math.max(1, pageData.meta.total_pages));
          return;
        }
        setTickets(pageData);
        setStats(statsData);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(messageOf(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filter, page, reloadKey]);

  function handleFilterChange(next: Filter) {
    setFilter(next);
    setPage(1);
  }

  function handleCreated() {
    // Show the new ticket: it starts as "open", which a "closed" filter would hide.
    setFilter('all');
    setPage(1);
    refresh();
  }

  async function handleStatusChange(ticket: Ticket, status: TicketStatus) {
    setUpdatingId(ticket.id);
    setError(null);
    try {
      await updateTicket(ticket.id, { status });
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setUpdatingId(null);
      refresh();
    }
  }

  return (
    <div className="layout">
      <aside>
        <TicketForm onCreated={handleCreated} />
      </aside>

      <section>
        <div className="toolbar">
          <StatusFilter value={filter} stats={stats} onChange={handleFilterChange} />
          {loading && <span className="muted small">Loading…</span>}
        </div>

        {error && <p className="error banner" role="alert">{error}</p>}

        {tickets && (
          <>
            <TicketList tickets={tickets.data} updatingId={updatingId} onStatusChange={handleStatusChange} />
            <Pagination meta={tickets.meta} disabled={loading} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
