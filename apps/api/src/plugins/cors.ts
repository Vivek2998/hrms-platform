import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';

export const corsPlugin = fp(async (app: FastifyInstance) => {
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow same-origin / non-browser (curl, mobile) requests
      if (!origin) {
        cb(null, true);
        return;
      }

      // Allow only explicitly listed origins — never wildcard subdomains
      // Add your Vercel URL to ALLOWED_ORIGINS env var:
      //   e.g. ALLOWED_ORIGINS=https://hrms-app.vercel.app,https://hrms.yourdomain.com
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }

      // Localhost only in development — never in production
      if (env.NODE_ENV === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        cb(null, true);
        return;
      }

      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
});
