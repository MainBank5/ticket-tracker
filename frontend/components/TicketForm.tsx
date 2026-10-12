'use client';

import { useState, type FormEvent } from 'react';
import { createTicket, ApiError } from '@/lib/api';
import { PRIORITY_LABELS, TICKET_PRIORITIES, type TicketPriority } from '@/lib/types';

export function TicketForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createTicket({ title: title.trim(), description, priority });
      setTitle('');
      setDescription('');
      setPriority('medium');
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the ticket');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>New ticket</h2>

      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="What's broken?" />
      </label>

      <label>
        Description <span className="muted">(optional)</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={5000} />
      </label>

      <label>
        Priority
        <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
          {TICKET_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="error" role="alert">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create ticket'}
      </button>
    </form>
  );
}
