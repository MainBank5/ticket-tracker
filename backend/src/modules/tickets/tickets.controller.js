import * as service from './tickets.service.js';

// Thin HTTP layer: translate request -> service call -> response.
// (Express 5 forwards rejected promises to the error handler, so no try/catch needed.)

export async function create(req, res) {
  const ticket = await service.createTicket(req.valid.body);
  res.status(201).json({ data: ticket });
}

export async function list(req, res) {
  const { items, meta } = await service.listTickets(req.valid.query);
  res.json({ data: items, meta });
}

export async function update(req, res) {
  const ticket = await service.updateTicket(req.valid.params.id, req.valid.body);
  res.json({ data: ticket });
}

export async function stats(_req, res) {
  res.json({ data: await service.getStats() });
}
