import { describe, expect, it } from 'vitest';
import { createChapterSchema, createSubjectSchema, updateSubjectSchema } from './curriculum.js';

describe('curriculum schemas', () => {
  it('trims and accepts a valid subject', () => {
    expect(createSubjectSchema.parse({ name: '  Biology ' }).name).toBe('Biology');
  });

  it('rejects an empty subject name', () => {
    expect(createSubjectSchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('rejects a chapter name over 120 characters', () => {
    expect(createChapterSchema.safeParse({ name: 'x'.repeat(121) }).success).toBe(false);
  });

  it('accepts Urdu names', () => {
    expect(createChapterSchema.safeParse({ name: 'حرکت' }).success).toBe(true);
  });

  it('lets an update change just one field', () => {
    expect(updateSubjectSchema.parse({ description: 'Grade 9' })).toEqual({
      description: 'Grade 9',
    });
  });
});
