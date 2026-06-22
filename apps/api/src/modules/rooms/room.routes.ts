import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
const ALL_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];

export function roomRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /rooms — list all active meeting rooms for the org
  app.get('/rooms', auth, async (req, reply) => {
    const rooms = await app.prisma.meetingRoom.findMany({
      where: { organizationId: req.user.orgId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return reply.send(ok(rooms));
  });

  // POST /rooms — create meeting room (HR+)
  app.post('/rooms', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const body = z.object({
      name: z.string().min(1),
      location: z.string().optional(),
      capacity: z.number().int().min(1).default(1),
      amenities: z.array(z.string()).default([]),
    }).parse(req.body);

    const room = await app.prisma.meetingRoom.create({
      data: { ...body, organizationId: req.user.orgId },
    });
    return reply.status(201).send(ok(room));
  });

  // PATCH /rooms/:id — update room (HR+)
  app.patch('/rooms/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({
      name: z.string().min(1).optional(),
      location: z.string().optional(),
      capacity: z.number().int().min(1).optional(),
      amenities: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);

    const existing = await app.prisma.meetingRoom.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!existing) throw fail('Room not found', 404);

    const room = await app.prisma.meetingRoom.update({ where: { id }, data: body });
    return reply.send(ok(room));
  });

  // DELETE /rooms/:id — deactivate room (HR+)
  app.delete('/rooms/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const existing = await app.prisma.meetingRoom.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!existing) throw fail('Room not found', 404);
    await app.prisma.meetingRoom.update({ where: { id }, data: { isActive: false } });
    return reply.send(ok({ message: 'Room deactivated' }));
  });

  // GET /rooms/bookings — list bookings (all employees see own; managers/HR see all)
  app.get('/rooms/bookings', auth, async (req, reply) => {
    const { roomId, date } = z.object({
      roomId: z.string().optional(),
      date: z.string().optional(),
    }).parse(req.query);

    const isPrivileged = HR_ROLES.includes(req.user.role) || req.user.role === 'MANAGER';

    const where: any = { organizationId: req.user.orgId, status: 'CONFIRMED' };
    if (!isPrivileged) where.bookedById = req.user.sub;
    if (roomId) where.roomId = roomId;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.startTime = { gte: d, lt: next };
    }

    const bookings = await app.prisma.roomBooking.findMany({
      where,
      include: {
        room: { select: { name: true, location: true, capacity: true } },
        bookedBy: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    return reply.send(ok(bookings));
  });

  // POST /rooms/bookings — create a booking
  app.post('/rooms/bookings', auth, async (req, reply) => {
    const body = z.object({
      roomId: z.string(),
      title: z.string().min(1),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      attendees: z.number().int().min(1).default(1),
      notes: z.string().optional(),
    }).parse(req.body);

    const start = new Date(body.startTime);
    const end = new Date(body.endTime);
    if (end <= start) throw fail('End time must be after start time', 400);
    if (start < new Date()) throw fail('Cannot book a room in the past', 400);

    // Check room exists and belongs to org
    const room = await app.prisma.meetingRoom.findFirst({
      where: { id: body.roomId, organizationId: req.user.orgId, isActive: true },
    });
    if (!room) throw fail('Room not found', 404);

    // Check capacity
    if (body.attendees > room.capacity) {
      throw fail(`Room capacity is ${room.capacity}`, 400);
    }

    // BUG-H04 + race-condition fix: conflict check AND booking creation run inside a
    // single SERIALIZABLE transaction. Without this, two simultaneous requests for
    // the same room/slot both read "no conflict" then both write — double-booking.
    // Serializable isolation causes the losing transaction to retry; on retry it
    // sees the winning booking as a conflict and throws 409.
    const booking = await app.prisma.$transaction(
      async (tx) => {
        const conflict = await tx.roomBooking.findFirst({
          where: {
            roomId: body.roomId,
            organizationId: req.user.orgId,
            status: 'CONFIRMED',
            AND: [
              { startTime: { lt: end } },
              { endTime: { gt: start } },
            ],
          },
        });
        if (conflict) throw fail('This room is already booked for the requested time slot. Please choose a different time.', 409);

        return tx.roomBooking.create({
          data: {
            organizationId: req.user.orgId,
            roomId: body.roomId,
            bookedById: req.user.sub,
            title: body.title,
            startTime: start,
            endTime: end,
            attendees: body.attendees,
            notes: body.notes,
          },
          include: {
            room: { select: { name: true, location: true } },
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
    return reply.status(201).send(ok(booking));
  });

  // DELETE /rooms/bookings/:id — cancel a booking
  app.delete('/rooms/bookings/:id', auth, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const isPrivileged = HR_ROLES.includes(req.user.role) || req.user.role === 'MANAGER';

    const booking = await app.prisma.roomBooking.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!booking) throw fail('Booking not found', 404);
    if (!isPrivileged && booking.bookedById !== req.user.sub) throw fail('Forbidden', 403);
    if (booking.status === 'CANCELLED') throw fail('Already cancelled', 400);

    await app.prisma.roomBooking.update({ where: { id }, data: { status: 'CANCELLED' } });
    return reply.send(ok({ message: 'Booking cancelled' }));
  });
}
