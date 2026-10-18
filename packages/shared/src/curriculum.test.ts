import { describe, expect, it } from 'vitest';
import { createSubjectSchema, createChapterSchema } from './schemas/curriculum.js';

describe('curriculum schemas', () => {
  it('trims and accepts a valid subject', () => {
    expect(createSubjectSchema.parse({ name: '  Biology ' }).name).toBe('Biology');
  });
  it('rejects an empty subject name', () => {
    expect(createSubjectSchema.safeParse({ name: '   ' }).success).toBe(false);
  });
  it('rejects a chapter title over 120 chars', () => {
    expect(createChapterSchema.safeParse({ title: 'x'.repeat(121) }).success).toBe(false);
  });
});
