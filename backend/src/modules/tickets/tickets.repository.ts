import { prisma } from '../../db/prisma.js';
import { Prisma, type Ticket } from '../../generated/prisma/client.js';
import type { TicketPriority, TicketStatus } from './tickets.constants.js';

// The only file that talks to the database for tickets.

export function insert(data: { title: string; description?: string; priority: TicketPriority }): Promise<Ticket> {
  return prisma.ticket.create({ data });
}

export async function findPage(args: {
  status?: TicketStatus;
  limit: number;
  offset: number;
}): Promise<{ items: Ticket[]; total: number }> {
  const where: Prisma.TicketWhereInput = args.status ? { status: args.status } : {};

  // One transaction so the page and the total come from the same snapshot.
  const [items, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: args.offset,
      take: args.limit,
    }),
    prisma.ticket.count({ where }),
  ]);
  return { items, total };
}

/** Returns the updated ticket, or null when no ticket has that id. */
export async function updateById(
  id: string,
  data: { status?: TicketStatus; priority?: TicketPriority },
): Promise<Ticket | null> {
  try {
    return await prisma.ticket.update({ where: { id }, data });
  } catch (err) {
    // P2025: "record to update not found"
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
}

export async function countByStatus(): Promise<{ status: string; count: number }[]> {
  const groups = await prisma.ticket.groupBy({ by: ['status'], _count: { _all: true } });
  return groups.map((g) => ({ status: g.status, count: g._count._all }));
}
