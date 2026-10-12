import { describe, expect, it } from 'vitest';
import { safeNextPath } from './session';

describe('safeNextPath', () => {
  it('keeps paths inside the app', () => {
    expect(safeNextPath('/teacher/exams?tab=active')).toBe('/teacher/exams?tab=active');
  });

  it('falls back to the dashboard for missing or outside links', () => {
    expect(safeNextPath(null)).toBe('/teacher/dashboard');
    expect(safeNextPath('https://evil.example')).toBe('/teacher/dashboard');
    expect(safeNextPath('//evil.example')).toBe('/teacher/dashboard');
    expect(safeNextPath('/\\evil.example')).toBe('/teacher/dashboard');
  });
});
