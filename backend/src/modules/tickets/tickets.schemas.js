import { z } from 'zod';
import { TICKET_PRIORITIES, TICKET_STATUSES } from './tickets.constants.js';

const status = z.enum(TICKET_STATUSES);
const priority = z.enum(TICKET_PRIORITIES);

// POST /tickets — new tickets always start "open", so status isn't accepted.
export const createTicketBody = z
  .object({
    title: z.string().trim().min(1, 'title is required').max(200, 'title must be at most 200 characters'),
    description: z.string().trim().max(5000, 'description must be at most 5000 characters').optional(),
    priority: priority.default('medium'),
  })
  .strict();

// GET /tickets
export const listTicketsQuery = z.object({
  status: status.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// PATCH /tickets/:id — only status and/or priority are editable.
export const updateTicketBody = z
  .object({
    status: status.optional(),
    priority: priority.optional(),
  })
  .strict()
  .refine((body) => body.status !== undefined || body.priority !== undefined, {
    message: 'Provide at least one of: status, priority',
  });

export const ticketIdParams = z.object({
  id: z.uuid('id must be a valid UUID'),
});
