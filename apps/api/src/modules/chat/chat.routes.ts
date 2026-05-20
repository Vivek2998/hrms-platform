import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { ok, fail } from '../../lib/response.js';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a helpful HR assistant for an HRMS platform. You help employees with questions about:
- Leave balances and leave policies
- Attendance and punch-in/out procedures
- Payslips and salary information
- Company policies and benefits
- Onboarding and offboarding processes
- Performance management

Be concise, professional, and friendly. If you don't know something specific about their company data,
suggest they contact HR directly or check the relevant section of the HRMS portal.
Do not make up specific data about the employee — only answer general policy questions unless context is provided.`;

export async function chatRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /chat/sessions — list user's recent sessions
  app.get('/chat/sessions', auth, async (req, reply) => {
    const sessions = await app.prisma.chatSession.findMany({
      where: { organizationId: req.user.orgId, employeeId: req.user.sub },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, role: true, createdAt: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    return reply.send(ok(sessions));
  });

  // POST /chat/sessions — start a new session
  app.post('/chat/sessions', auth, async (req, reply) => {
    const session = await app.prisma.chatSession.create({
      data: { organizationId: req.user.orgId, employeeId: req.user.sub },
    });
    return reply.status(201).send(ok(session));
  });

  // GET /chat/sessions/:id/messages — get full conversation
  app.get('/chat/sessions/:id/messages', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const session = await app.prisma.chatSession.findFirst({
      where: { id, organizationId: req.user.orgId, employeeId: req.user.sub },
    });
    if (!session) throw fail('Session not found', 404);

    const messages = await app.prisma.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send(ok(messages));
  });

  // POST /chat/sessions/:id/messages — send a message + get AI reply
  app.post('/chat/sessions/:id/messages', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(req.body);

    const session = await app.prisma.chatSession.findFirst({
      where: { id, organizationId: req.user.orgId, employeeId: req.user.sub },
    });
    if (!session) throw fail('Session not found', 404);

    // Load history for context (last 20 messages)
    const history = await app.prisma.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Save user message
    await app.prisma.chatMessage.create({ data: { sessionId: id, role: 'user', content } });

    // Call Claude
    const messages: Anthropic.MessageParam[] = [
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content },
    ];

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const assistantContent = response.content[0].type === 'text' ? response.content[0].text : '';

    // Save assistant reply + update session timestamp
    const [assistantMsg] = await app.prisma.$transaction([
      app.prisma.chatMessage.create({ data: { sessionId: id, role: 'assistant', content: assistantContent } }),
      app.prisma.chatSession.update({ where: { id }, data: { updatedAt: new Date() } }),
    ]);

    return reply.send(ok({ role: 'assistant', content: assistantContent, id: assistantMsg.id }));
  });
}
