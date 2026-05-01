import fp from "fastify-plugin";
import fastifyRedis from "@fastify/redis";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export const redisPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyRedis, { url: env.REDIS_URL });
});
