import type { FastifyInstance } from 'fastify';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeListSchema,
} from './employee.schema.js';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  softDeleteEmployee,
} from './employee.service.js';
import { ok } from '../../lib/response.js';

export function employeeRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /employees
  app.get('/employees', auth, async (req, reply) => {
    const query = employeeListSchema.parse(req.query);
    const result = await listEmployees(req.user.orgId, query, app.prisma);
    return reply.send(result);
  });

  // GET /employees/:id
  app.get('/employees/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const employee = await getEmployee(id, req.user.orgId, app.prisma);
    return reply.send(ok(employee));
  });

  // POST /employees
  app.post('/employees', auth, async (req, reply) => {
    const input = createEmployeeSchema.parse(req.body);
    const employee = await createEmployee(req.user.orgId, input, app.prisma);
    return reply.status(201).send(ok(employee));
  });

  // PATCH /employees/:id
  app.patch('/employees/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = updateEmployeeSchema.parse(req.body);
    const employee = await updateEmployee(id, req.user.orgId, input, app.prisma);
    return reply.send(ok(employee));
  });

  // DELETE /employees/:id  (soft delete)
  app.delete('/employees/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    await softDeleteEmployee(id, req.user.orgId, app.prisma);
    return reply.status(204).send();
  });
}
