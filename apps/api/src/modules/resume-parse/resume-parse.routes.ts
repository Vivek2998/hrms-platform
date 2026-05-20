import type { FastifyInstance } from 'fastify';
import { ok, fail } from '../../lib/response.js';
import Anthropic from '@anthropic-ai/sdk';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

let anthropic: Anthropic | null = null;
function getAI() {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic;
}

async function parseResumeText(text: string): Promise<object | null> {
  try {
    const ai = getAI();
    const msg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Extract structured data from this resume. Return ONLY valid JSON with: name, email, phone, skills (array), totalExperienceYears (number), currentTitle, currentCompany, education (array of {degree, institution, year}), summary.\n\n${text.slice(0, 4000)}`,
      }],
    });
    const blocks = msg.content;
    for (const block of blocks) {
      if (block.type === 'text') {
        const match = block.text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]) as object;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function resumeParseRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get('/resume-parse', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const data = await app.prisma.parsedResume.findMany({
      where: { organizationId: req.user.orgId },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(data));
  });

  app.post('/resume-parse', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const { fileName, fileUrl, text } = req.body as any;
    if (!fileName || !fileUrl) throw fail('fileName and fileUrl are required', 400);

    const record = await app.prisma.parsedResume.create({
      data: { organizationId: req.user.orgId, uploadedBy: req.user.sub, fileName, fileUrl, status: 'PENDING' },
    });

    if (text) {
      void parseResumeText(text as string).then((parsedData) =>
        app.prisma.parsedResume.update({
          where: { id: record.id },
          data: { parsedData: parsedData ?? undefined, status: parsedData ? 'PARSED' : 'FAILED' },
        })
      );
    }

    return reply.status(201).send(ok(record));
  });

  app.get('/resume-parse/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const { id } = req.params as any;
    const data = await app.prisma.parsedResume.findFirst({ where: { id, organizationId: req.user.orgId } });
    if (!data) throw fail('Not found', 404);
    return reply.send(ok(data));
  });

  app.post('/resume-parse/:id/reparse', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const { id } = req.params as any;
    const { text } = req.body as any;
    if (!text) throw fail('text is required', 400);
    await app.prisma.parsedResume.update({ where: { id, organizationId: req.user.orgId }, data: { status: 'PENDING' } });
    const parsedData = await parseResumeText(text as string);
    const updated = await app.prisma.parsedResume.update({
      where: { id, organizationId: req.user.orgId },
      data: { parsedData: parsedData ?? undefined, status: parsedData ? 'PARSED' : 'FAILED' },
    });
    return reply.send(ok(updated));
  });
}
