import type { Request, Response } from 'express';
import { getValid } from '../../common/middleware/validate.js';
import { createTicketBody, listTicketsQuery, ticketIdParams, updateTicketBody } from './tickets.schemas.js';
import * as service from './tickets.service.js';

// Thin HTTP layer: translate request -> service call -> response.
// (Express 5 forwards rejected promises to the error handler, so no try/catch needed.)

export async function create(req: Request, res: Response): Promise<void> {
  const ticket = await service.createTicket(getValid(req, 'body', createTicketBody));
  res.status(201).json({ data: ticket });
}

export async function list(req: Request, res: Response): Promise<void> {
  const { items, meta } = await service.listTickets(getValid(req, 'query', listTicketsQuery));
  res.json({ data: items, meta });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = getValid(req, 'params', ticketIdParams);
  const ticket = await service.updateTicket(id, getValid(req, 'body', updateTicketBody));
  res.json({ data: ticket });
}

export async function stats(_req: Request, res: Response): Promise<void> {
  res.json({ data: await service.getStats() });
}
