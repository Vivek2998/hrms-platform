import type { PaginationMeta } from '@hrms/shared-types';

export function ok<T>(data: T, meta?: PaginationMeta) {
  return { success: true as const, data, meta: meta ?? null, error: null };
}

export function paginated<T>(data: T[], page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
  return ok(data, meta);
}

export function fail(message: string, statusCode = 400) {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}
