import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { ok, fail } from '../../lib/response.js';

const client = new Anthropic();

const MODEL = 'claude-sonnet-4-6';
const MAX_TOOL_ROUNDS = 6;

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a smart, proactive HR Assistant embedded in an HRMS platform.
You have access to the logged-in employee's real data and can take actions on their behalf.

CAPABILITIES:
- Answer HR questions using the employee's actual data (leave balance, attendance, shift, holidays, announcements)
- Take actions: apply leave, request WFH, regularise attendance, raise helpdesk tickets, send kudos
- Multi-turn conversations with full context

RULES:
1. SENSITIVE TOOLS: Tools marked SENSITIVE expose financial/private data. Before calling one, explicitly ask the employee:
   "To answer that I'd need to access your [X]. Is that okay?" — only call the tool after they confirm.
2. CONFIRM BEFORE ACTING: For any write action (apply leave, WFH, etc.) first summarise what you'll do and ask "Shall I go ahead?" — only call the action tool after they confirm.
3. NEVER access other employees' private data.
4. Be concise and friendly. Use bullet points for lists of data.
5. After completing an action, clearly confirm what was done and any reference info (e.g. ticket ID).
6. If a question is outside your tools (travel booking, documents, salary structure), tell the employee which section of the portal to visit.
7. Today's date in your context may be approximate — always use the current date from the system when doing date logic.`;

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_my_profile',
    description: "Get the employee's profile: name, department, designation, manager, joining date, employment type.",
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_leave_types',
    description: 'Get all active leave types in the organisation (Casual Leave, Sick Leave, etc.) with IDs, codes, and days allowed.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_my_leave_balance',
    description: "Get the employee's current leave balances — allocated, used, pending, and remaining days per leave type.",
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_my_leaves',
    description: "Get the employee's leave requests, optionally filtered by status.",
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
          description: 'Filter by status. Omit to get all recent leaves.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_my_attendance',
    description: "Get the employee's attendance records (punch-in/out, working hours) for a given month.",
    input_schema: {
      type: 'object' as const,
      properties: {
        month: { type: 'string', description: 'Month in YYYY-MM format. Defaults to current month.' },
      },
      required: [],
    },
  },
  {
    name: 'get_holidays',
    description: 'Get the list of public holidays for a given year.',
    input_schema: {
      type: 'object' as const,
      properties: {
        year: { type: 'number', description: 'Year e.g. 2026. Defaults to current year.' },
      },
      required: [],
    },
  },
  {
    name: 'get_announcements',
    description: 'Get recent company announcements and pinned notices.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_my_shift',
    description: "Get the employee's current shift name, start/end times, and weekly off days.",
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'apply_leave',
    description: 'Apply for leave on behalf of the employee. Always confirm the full details with the user before calling.',
    input_schema: {
      type: 'object' as const,
      properties: {
        leaveTypeId: { type: 'string', description: 'ID of the leave type (from get_leave_types)' },
        startDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
        endDate: { type: 'string', description: 'End date YYYY-MM-DD' },
        reason: { type: 'string', description: 'Reason for leave' },
        halfDay: { type: 'boolean', description: 'True for half-day leave' },
      },
      required: ['leaveTypeId', 'startDate', 'endDate', 'reason'],
    },
  },
  {
    name: 'request_regularisation',
    description: 'Request attendance regularisation for a missed or wrong punch. Confirm details first.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Date YYYY-MM-DD' },
        punchIn: { type: 'string', description: 'Requested punch-in time HH:mm (24h). Optional.' },
        punchOut: { type: 'string', description: 'Requested punch-out time HH:mm (24h). Optional.' },
        reason: { type: 'string', description: 'Reason for regularisation' },
      },
      required: ['date', 'reason'],
    },
  },
  {
    name: 'request_wfh',
    description: 'Request Work From Home for one or more dates. Confirm with user first.',
    input_schema: {
      type: 'object' as const,
      properties: {
        dates: { type: 'array', items: { type: 'string' }, description: 'Dates in YYYY-MM-DD format' },
        reason: { type: 'string', description: 'Reason for WFH' },
      },
      required: ['dates', 'reason'],
    },
  },
  {
    name: 'raise_helpdesk_ticket',
    description: 'Raise a helpdesk support ticket on behalf of the employee.',
    input_schema: {
      type: 'object' as const,
      properties: {
        subject: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', enum: ['GENERAL', 'PAYROLL', 'ATTENDANCE', 'LEAVE', 'IT', 'HR', 'OTHER'] },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
      },
      required: ['subject', 'description', 'category', 'priority'],
    },
  },
  {
    name: 'send_kudos',
    description: "Send a kudos/recognition to a colleague on the employee's behalf.",
    input_schema: {
      type: 'object' as const,
      properties: {
        toEmployeeId: { type: 'string', description: 'ID of the recipient employee' },
        message: { type: 'string', description: 'Recognition message' },
        category: {
          type: 'string',
          enum: ['TEAMWORK', 'INNOVATION', 'LEADERSHIP', 'CUSTOMER_FOCUS', 'GOING_ABOVE_AND_BEYOND', 'PROBLEM_SOLVING', 'MENTORSHIP', 'OTHER'],
        },
      },
      required: ['toEmployeeId', 'message', 'category'],
    },
  },
  // ── Sensitive tools ────────────────────────────────────────────────────────
  {
    name: 'get_my_payslip',
    description: 'SENSITIVE: Fetches payslip data (net pay, earnings, deductions). ALWAYS ask user permission before calling.',
    input_schema: {
      type: 'object' as const,
      properties: {
        month: { type: 'number', description: '1–12' },
        year: { type: 'number', description: 'e.g. 2026' },
      },
      required: [],
    },
  },
  {
    name: 'get_my_expense_claims',
    description: 'SENSITIVE: Fetches expense claims and reimbursements. ALWAYS ask user permission before calling.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_my_loans',
    description: 'SENSITIVE: Fetches loan and salary advance requests. ALWAYS ask user permission before calling.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
];

// ─── Tool executor ────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  prisma: FastifyInstance['prisma'],
  employeeId: string,
  orgId: string,
): Promise<string> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    switch (name) {
      case 'get_my_profile': {
        const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!emp) return 'Employee record not found.';
        const [dept, manager] = await Promise.all([
          emp.departmentId ? prisma.department.findUnique({ where: { id: emp.departmentId }, select: { name: true } }) : null,
          emp.managerId ? prisma.employee.findUnique({ where: { id: emp.managerId }, select: { firstName: true, lastName: true } }) : null,
        ]);
        return JSON.stringify({
          name: `${emp.firstName} ${emp.lastName}`,
          workEmail: emp.workEmail,
          department: dept?.name ?? null,
          designation: emp.designation ?? null,
          employmentType: emp.employmentType,
          dateOfJoining: emp.dateOfJoining,
          noticePeriodDays: emp.noticePeriodDays,
          manager: manager ? `${manager.firstName} ${manager.lastName}` : null,
        });
      }

      case 'get_leave_types': {
        const types = await prisma.leaveType.findMany({
          where: { organizationId: orgId, isActive: true, deletedAt: null },
          select: { id: true, name: true, code: true, daysAllowed: true, isPaid: true, isCarryForward: true },
          orderBy: { name: 'asc' },
        });
        return JSON.stringify(types);
      }

      case 'get_my_leave_balance': {
        const balances = await prisma.leaveBalance.findMany({
          where: { organizationId: orgId, employeeId, year: currentYear },
          include: { leaveType: { select: { name: true, code: true } } },
        });
        return JSON.stringify(
          balances.map((b) => ({
            type: b.leaveType.name,
            code: b.leaveType.code,
            allocated: b.allocated,
            used: b.used,
            pending: b.pending,
            remaining: b.allocated + b.carried - b.used - b.pending,
          })),
        );
      }

      case 'get_my_leaves': {
        const status = input.status as string | undefined;
        const requests = await prisma.leaveRequest.findMany({
          where: {
            organizationId: orgId,
            employeeId,
            deletedAt: null,
            ...(status ? { status: status as never } : {}),
          },
          include: { leaveType: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
        return JSON.stringify(
          requests.map((r) => ({
            id: r.id,
            type: r.leaveType.name,
            from: r.fromDate,
            to: r.toDate,
            days: r.totalDays,
            reason: r.reason,
            status: r.status,
          })),
        );
      }

      case 'get_my_attendance': {
        const monthStr = (input.month as string | undefined) ?? currentMonth;
        const [yr, mo] = monthStr.split('-').map(Number);
        const from = new Date(yr, mo - 1, 1);
        const to = new Date(yr, mo, 0, 23, 59, 59);
        const records = await prisma.attendanceRecord.findMany({
          where: { organizationId: orgId, employeeId, date: { gte: from, lte: to } },
          orderBy: { date: 'desc' },
        });
        return JSON.stringify(
          records.map((r) => ({
            date: r.date,
            status: r.status,
            punchIn: r.punchIn,
            punchOut: r.punchOut,
            workingMinutes: r.workingMinutes,
            lateMinutes: r.lateMinutes,
          })),
        );
      }

      case 'get_holidays': {
        const year = (input.year as number | undefined) ?? currentYear;
        const holidays = await prisma.holiday.findMany({
          where: { organizationId: orgId, year },
          orderBy: { date: 'asc' },
          select: { name: true, date: true, type: true },
        });
        return JSON.stringify(holidays);
      }

      case 'get_announcements': {
        const announcements = await prisma.announcement.findMany({
          where: { organizationId: orgId, deletedAt: null },
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          take: 10,
          select: { title: true, content: true, isPinned: true, createdAt: true },
        });
        return JSON.stringify(announcements);
      }

      case 'get_my_shift': {
        const assignment = await prisma.shiftAssignment.findFirst({
          where: { employeeId, effectiveTo: null },
          include: { shift: true },
          orderBy: { effectiveFrom: 'desc' },
        });
        if (!assignment) return 'No shift assigned.';
        const { shift } = assignment;
        return JSON.stringify({
          name: shift.name,
          code: shift.code,
          startTime: shift.startTime,
          endTime: shift.endTime,
          graceMinutes: shift.graceMinutes,
          weeklyOffDays: shift.weeklyOffDays,
          isNightShift: shift.isNightShift,
        });
      }

      case 'apply_leave': {
        const { leaveTypeId, startDate, endDate, reason, halfDay } = input as {
          leaveTypeId: string; startDate: string; endDate: string; reason: string; halfDay?: boolean;
        };
        const from = new Date(startDate);
        const to = new Date(endDate);
        const totalDays = halfDay ? 0.5 : Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
        const request = await prisma.leaveRequest.create({
          data: {
            organizationId: orgId,
            employeeId,
            leaveTypeId,
            fromDate: from,
            toDate: to,
            totalDays,
            reason,
          },
          include: { leaveType: { select: { name: true } } },
        });
        return JSON.stringify({
          success: true,
          message: `${request.leaveType.name} applied for ${totalDays} day(s) from ${startDate} to ${endDate}.`,
          requestId: request.id,
          status: request.status,
        });
      }

      case 'request_regularisation': {
        const { date, punchIn, punchOut, reason } = input as {
          date: string; punchIn?: string; punchOut?: string; reason: string;
        };
        const reg = await prisma.attendanceRegularisation.create({
          data: {
            organizationId: orgId,
            employeeId,
            date: new Date(date),
            requestedIn: punchIn ?? null,
            requestedOut: punchOut ?? null,
            reason,
          },
        });
        return JSON.stringify({ success: true, requestId: reg.id, status: reg.status });
      }

      case 'request_wfh': {
        const { dates, reason } = input as { dates: string[]; reason: string };
        const created: string[] = [];
        const skipped: string[] = [];
        for (const d of dates) {
          try {
            await prisma.wFHRequest.create({
              data: { organizationId: orgId, employeeId, date: new Date(d), reason },
            });
            created.push(d);
          } catch {
            skipped.push(d); // unique constraint = already exists
          }
        }
        return JSON.stringify({ success: true, created, skipped });
      }

      case 'raise_helpdesk_ticket': {
        const { subject, description, category, priority } = input as {
          subject: string; description: string; category: string; priority: string;
        };
        const ticket = await prisma.helpDeskTicket.create({
          data: { organizationId: orgId, employeeId, subject, description, category, priority: priority as never },
        });
        return JSON.stringify({ success: true, ticketId: ticket.id, status: ticket.status });
      }

      case 'send_kudos': {
        const { toEmployeeId, message, category } = input as {
          toEmployeeId: string; message: string; category: string;
        };
        const kudos = await prisma.kudos.create({
          data: {
            organizationId: orgId,
            fromEmployeeId: employeeId,
            toEmployeeId,
            message,
            category: category as never,
          },
          include: { toEmployee: { select: { firstName: true, lastName: true } } },
        });
        return JSON.stringify({
          success: true,
          message: `Kudos sent to ${kudos.toEmployee.firstName} ${kudos.toEmployee.lastName}!`,
        });
      }

      // ── Sensitive tools ──────────────────────────────────────────────────────

      case 'get_my_payslip': {
        const month = (input.month as number | undefined) ?? now.getMonth() + 1;
        const year = (input.year as number | undefined) ?? currentYear;
        const payslip = await prisma.payslip.findFirst({
          where: { organizationId: orgId, employeeId, month, year },
          select: { month: true, year: true, grossEarnings: true, totalDeductions: true, netPay: true, presentDays: true, lopDays: true },
        });
        if (!payslip) return `No payslip found for ${month}/${year}.`;
        return JSON.stringify(payslip);
      }

      case 'get_my_expense_claims': {
        const claims = await prisma.expenseClaim.findMany({
          where: { organizationId: orgId, employeeId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, title: true, amount: true, category: true, status: true, expenseDate: true },
        });
        return JSON.stringify(claims);
      }

      case 'get_my_loans': {
        const loans = await prisma.loanRequest.findMany({
          where: { organizationId: orgId, employeeId },
          orderBy: { createdAt: 'desc' },
          select: { id: true, loanType: true, amount: true, purpose: true, status: true, repaidAmount: true },
        });
        return JSON.stringify(loans);
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Tool error: ${String(err)}`;
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function chatRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get('/chat/sessions', auth, async (req, reply) => {
    const sessions = await app.prisma.chatSession.findMany({
      where: { organizationId: req.user.orgId, employeeId: req.user.sub },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, role: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    return reply.send(ok(sessions));
  });

  app.post('/chat/sessions', auth, async (req, reply) => {
    const session = await app.prisma.chatSession.create({
      data: { organizationId: req.user.orgId, employeeId: req.user.sub },
    });
    return reply.status(201).send(ok(session));
  });

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

  app.post('/chat/sessions/:id/messages', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { content } = z.object({ content: z.string().min(1).max(4000) }).parse(req.body);
    const employeeId = req.user.sub;
    const orgId = req.user.orgId;

    const session = await app.prisma.chatSession.findFirst({
      where: { id, organizationId: orgId, employeeId },
    });
    if (!session) throw fail('Session not found', 404);

    const history = await app.prisma.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });

    await app.prisma.chatMessage.create({ data: { sessionId: id, role: 'user', content } });

    // Build message history for Claude (only user/assistant text turns)
    const messages: Anthropic.MessageParam[] = [
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content },
    ];

    // ── Agentic tool-use loop ──────────────────────────────────────────────────
    let finalText = '';

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      });

      const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text');
      const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');

      if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
        finalText = textBlocks.map((b) => b.text).join('');
        break;
      }

      // Add Claude's response (may contain text + tool_use blocks) to messages
      messages.push({ role: 'assistant', content: response.content });

      // Execute all requested tools in parallel
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => ({
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            app.prisma,
            employeeId,
            orgId,
          ),
        })),
      );

      messages.push({ role: 'user', content: toolResults });
    }

    if (!finalText) {
      finalText = "I've completed the requested action. Let me know if there's anything else I can help with!";
    }

    const [assistantMsg] = await app.prisma.$transaction([
      app.prisma.chatMessage.create({ data: { sessionId: id, role: 'assistant', content: finalText } }),
      app.prisma.chatSession.update({ where: { id }, data: { updatedAt: new Date() } }),
    ]);

    return reply.send(ok({ role: 'assistant', content: finalText, id: assistantMsg.id }));
  });
}
