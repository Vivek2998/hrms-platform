import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  // BUG-L02: Cap at 500 — prevents unbounded queries while allowing dropdown use cases.
  // BUG-M05: Removed sortBy/sortOrder — they were accepted but silently ignored.
  // Each route defines its own orderBy to prevent misleading API contracts.
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

export function paginationArgs(query: PaginationQuery) {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  };
}
