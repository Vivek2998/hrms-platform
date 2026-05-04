import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import type { NotificationJobData } from './queues.js';

const prisma = new PrismaClient();

export const notificationWorker = new Worker<NotificationJobData>(
  'notification',
  async (job) => {
    const { organizationId, employeeId, type, title, body, data } = job.data;

    await prisma.notification.create({
      data: {
        organizationId,
        employeeId,
        type: type as Prisma.NotificationCreateInput['type'],
        title,
        body,
        data: data as Prisma.InputJsonValue | undefined,
      },
    });
  },
  {
    connection: { url: env.REDIS_URL },
    concurrency: 10,
  },
);

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id ?? 'unknown'} failed:`, err.message);
});
