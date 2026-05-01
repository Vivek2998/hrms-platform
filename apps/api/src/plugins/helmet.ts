import fp from "fastify-plugin";
import fastifyHelmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";

export const helmetPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Managed by reverse proxy in prod
  });
});
