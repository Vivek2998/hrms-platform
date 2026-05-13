import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env.js';
import type { JwtPayload } from '@hrms/shared-types';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateSuperAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const jwtPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_ACCESS_TTL },
  });

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({
        success: false,
        data: null,
        error: 'Unauthorized — invalid or expired token',
      });
    }
  });

  app.decorate('authenticateSuperAdmin', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
      if (req.user.role !== 'SUPER_ADMIN') {
        return reply.status(403).send({
          success: false,
          data: null,
          error: 'Forbidden — Super Admin access only',
        });
      }
    } catch {
      return reply.status(401).send({
        success: false,
        data: null,
        error: 'Unauthorized — invalid or expired token',
      });
    }
  });
});
