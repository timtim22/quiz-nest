import { describe, expect, it } from 'vitest';
import { MAX_PAGE_SIZE, paginationQuerySchema } from './pagination.js';

describe('paginationQuerySchema', () => {
  it('uses defaults when nothing is passed', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('converts query-string values to numbers', () => {
    expect(paginationQuerySchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it('rejects page sizes above the maximum', () => {
    expect(paginationQuerySchema.safeParse({ pageSize: MAX_PAGE_SIZE + 1 }).success).toBe(false);
  });

  it('rejects a page below 1', () => {
    expect(paginationQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  });
});
