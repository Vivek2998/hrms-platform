import type { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";

export function errorHandler(
  error: FastifyError,
  _req: FastifyRequest,
  reply: FastifyReply,
) {
  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      data: null,
      error: "Validation failed",
      details: error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Fastify validation errors (JSON Schema)
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      data: null,
      error: "Validation failed",
      details: error.validation,
    });
  }

  const statusCode = error.statusCode ?? 500;

  if (statusCode >= 500) {
    reply.log.error(error);
  }

  return reply.status(statusCode).send({
    success: false,
    data: null,
    error: statusCode >= 500 ? "Internal server error" : error.message,
  });
}
