import { z } from 'zod';

export const MAX_PAGE_SIZE = 100;

/** Query params for any paginated list endpoint, e.g. `?page=2&pageSize=20`. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Response body for any paginated list endpoint. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
