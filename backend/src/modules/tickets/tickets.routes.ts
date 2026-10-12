import { Router } from 'express';
import { validate } from '../../common/middleware/validate.js';
import * as controller from './tickets.controller.js';
import { createTicketBody, listTicketsQuery, ticketIdParams, updateTicketBody } from './tickets.schemas.js';

const router = Router();

router.post('/', validate({ body: createTicketBody }), controller.create);
router.get('/', validate({ query: listTicketsQuery }), controller.list);
router.get('/stats', controller.stats); // declared before any /:id GET route
router.patch('/:id', validate({ params: ticketIdParams, body: updateTicketBody }), controller.update);

export default router;
