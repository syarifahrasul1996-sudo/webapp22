import { describe, expect, it } from 'vitest';
import { parseDateStringToTimestamp } from '../utils';

const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0) => new Date(y, m - 1, d, h, min, s).getTime();
const parse = (text: string) => parseDateStringToTimestamp(text, -1).timestamp;
const FALLBACK = -1;

describe('parseDateStringToTimestamp', () => {
  it('reads DD/MM/YYYY as day first (6 July, not June 7)', () => {
    expect(parse('06/07/2026')).toBe(at(2026, 7, 6));
    expect(parse('06-07-2026')).toBe(at(2026, 7, 6));
  });

  it('reads 12-hour times with AM/PM', () => {
    expect(parse('06/07/2026 8:30 PM')).toBe(at(2026, 7, 6, 20, 30));
    expect(parse('06/07/2026 8 PM')).toBe(at(2026, 7, 6, 20, 0));
    expect(parse('06/07/2026 12:15 AM')).toBe(at(2026, 7, 6, 0, 15));
    expect(parse('06/07/2026 12:15 PM')).toBe(at(2026, 7, 6, 12, 15));
  });

  it('reads 24-hour times and ignores the word "at"', () => {
    expect(parse('06/07/2026 18:45')).toBe(at(2026, 7, 6, 18, 45));
    expect(parse('06/07/2026 at 8:30 PM')).toBe(at(2026, 7, 6, 20, 30));
  });

  it('reads year-first dates', () => {
    expect(parse('2026-07-06')).toBe(at(2026, 7, 6));
    expect(parse('2026/07/06 9:05 AM')).toBe(at(2026, 7, 6, 9, 5));
  });

  it('reads English month names', () => {
    expect(parse('7 Nov 2026 8:00 PM')).toBe(at(2026, 11, 7, 20, 0));
  });

  it('reads Malay month names', () => {
    expect(parse('7 Disember 2026 8:00 PM')).toBe(at(2026, 12, 7, 20, 0));
    expect(parse('7 Ogos 2026 8:00 PM')).toBe(at(2026, 8, 7, 20, 0));
    expect(parse('7 Mei 2026 8:00 PM')).toBe(at(2026, 5, 7, 20, 0));
  });

  it('rejects impossible dates instead of rolling them over', () => {
    expect(parse('31/02/2026')).toBe(FALLBACK);
    expect(parse('32/01/2026')).toBe(FALLBACK);
    expect(parse('15/13/2026')).toBe(FALLBACK);
  });

  it('returns the fallback for blank or unreadable text', () => {
    expect(parse('')).toBe(FALLBACK);
    expect(parse('   ')).toBe(FALLBACK);
    expect(parse('tomorrow evening')).toBe(FALLBACK);
  });
});
