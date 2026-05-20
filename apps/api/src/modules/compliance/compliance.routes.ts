import type { FastifyInstance } from 'fastify';
import { ok } from '../../lib/response.js';

interface ComplianceEvent {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  category: 'PF' | 'ESI' | 'PT' | 'TDS' | 'INCOME_TAX' | 'ROC';
  isOverdue: boolean;
}

function getDeadlines(year: number, month: number, org: { pfEnabled: boolean; esiEnabled: boolean; ptEnabled: boolean }): ComplianceEvent[] {
  const events: ComplianceEvent[] = [];
  const today = new Date();

  const add = (
    id: string, title: string, desc: string,
    y: number, m: number, d: number,
    category: ComplianceEvent['category'],
  ) => {
    const due = new Date(y, m - 1, d);
    events.push({ id, title, description: desc, dueDate: due.toISOString().slice(0, 10), category, isOverdue: due < today });
  };

  // Generate 3-month window (prev, current, next)
  for (let offset = -1; offset <= 2; offset++) {
    let m = month + offset;
    let y = year;
    if (m > 12) { m -= 12; y++; }
    if (m < 1) { m += 12; y--; }

    const monthStr = `${y}-${String(m).padStart(2, '0')}`;

    if (org.pfEnabled) {
      add(`pf-${monthStr}`, 'PF Challan Deposit', `Deposit PF contributions for ${monthStr}`, y, m, 15, 'PF');
      add(`pf-return-${monthStr}`, 'PF Monthly Return (ECR)', `File ECR for ${monthStr}`, y, m, 25, 'PF');
    }
    if (org.esiEnabled) {
      add(`esi-${monthStr}`, 'ESI Challan Deposit', `Deposit ESI contributions for ${monthStr}`, y, m, 15, 'ESI');
    }
    if (org.ptEnabled) {
      add(`pt-${monthStr}`, 'Professional Tax Deposit', `Deposit PT for ${monthStr}`, y, m, 20, 'PT');
    }
    add(`tds-${monthStr}`, 'TDS Deposit', `Deposit TDS deducted for ${monthStr}`, y, m, 7, 'TDS');
  }

  // Quarterly TDS returns
  const quarters = [
    { id: `tds-q1-${year}`, title: 'TDS Return Q1 (Form 24Q)', due: `${year}-07-31`, desc: 'April–June quarter' },
    { id: `tds-q2-${year}`, title: 'TDS Return Q2 (Form 24Q)', due: `${year}-10-31`, desc: 'July–September quarter' },
    { id: `tds-q3-${year}`, title: 'TDS Return Q3 (Form 24Q)', due: `${String(year + 1)}-01-31`, desc: 'October–December quarter' },
    { id: `tds-q4-${year}`, title: 'TDS Return Q4 (Form 24Q)', due: `${String(year + 1)}-05-31`, desc: 'January–March quarter' },
  ];
  for (const q of quarters) {
    const due = new Date(q.due);
    events.push({ id: q.id, title: q.title, description: q.desc, dueDate: q.due, category: 'TDS', isOverdue: due < today });
  }

  return events.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function complianceRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /compliance/calendar
  app.get('/compliance/calendar', auth, async (req, reply) => {
    const org = await app.prisma.organization.findFirst({
      where: { id: req.user.orgId },
      select: { pfEnabled: true, esiEnabled: true, ptEnabled: true },
    });
    if (!org) throw new Error('Organization not found');

    const today = new Date();
    const events = getDeadlines(today.getFullYear(), today.getMonth() + 1, org);
    return reply.send(ok(events));
  });
}
