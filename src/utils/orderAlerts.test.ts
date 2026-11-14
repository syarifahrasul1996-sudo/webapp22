import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrderHistoryItem } from '../types';
import { computeOrderAlerts } from './orderAlerts';

const MIN = 60_000;
const HOUR = 60 * MIN;
// Fixed "now": Sat 14 Nov 2026, 10:00 Malaysia time.
const NOW = new Date(2026, 10, 14, 10, 0, 0).getTime();

function order(dueInMs: number | null, state: Record<string, unknown> = {}): OrderHistoryItem {
  return {
    id: 'o1', timestamp: NOW, messages: [],
    state: { customerName: 'Ali', mainType: 'Resume', subType: 'Standard',
      ...(dueInMs === null ? {} : { dueTimestamp: NOW + dueInMs }), ...state } as any,
  } as OrderHistoryItem;
}
const ids = (o: OrderHistoryItem, lang: 'ms' | 'en' = 'en') => computeOrderAlerts(o, lang).map((a) => a.id).sort();

describe('computeOrderAlerts', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => vi.useRealTimers());

  it('schedules all three reminders for an order due in 5 hours with no link', () => {
    expect(ids(order(5 * HOUR))).toEqual(['due-now', 'three-hour', 'twenty-mins']);
  });

  it('puts each reminder at the right time', () => {
    const due = NOW + 5 * HOUR;
    const byId = Object.fromEntries(computeOrderAlerts(order(5 * HOUR), 'en').map((a) => [a.id, a.triggerAt]));
    expect(byId['twenty-mins']).toBe(due - 20 * MIN);
    expect(byId['due-now']).toBe(due);
    expect(byId['three-hour']).toBe(due - 3 * HOUR);
  });

  it('skips the 3-hour "ask status" reminder once a link has been added', () => {
    expect(ids(order(5 * HOUR, { googleSheetLink: 'https://docs.google.com/x' }))).toEqual(['due-now', 'twenty-mins']);
    expect(ids(order(5 * HOUR, { googleSheetLink: '   ' }))).toContain('three-hour');
  });

  it('skips the 3-hour reminder when the order is due in less than 3 hours', () => {
    expect(ids(order(2 * HOUR))).toEqual(['due-now', 'twenty-mins']);
  });

  it('sends a near-immediate warning when already inside the last 20 minutes', () => {
    const alerts = computeOrderAlerts(order(10 * MIN), 'en');
    const immediate = alerts.find((a) => a.id === 'twenty-mins-immediate');
    expect(immediate?.triggerAt).toBe(NOW + 5000);
    expect(alerts.map((a) => a.id)).not.toContain('twenty-mins');
  });

  it('does not repeat reminders that were already sent', () => {
    expect(ids(order(10 * MIN, { hasNotified: true }))).toEqual(['due-now']);
    expect(ids(order(10 * MIN, { hasNotified: true, hasDueAlerted: true }))).toEqual([]);
  });

  it('sends nothing for delivered orders', () => {
    expect(ids(order(5 * HOUR, { isDelivered: true }))).toEqual([]);
  });

  it('sends nothing for orders already past due or with no due date', () => {
    expect(ids(order(-HOUR))).toEqual([]);
    expect(ids(order(null))).toEqual([]);
  });

  it('writes the message in the chosen language and handles a missing name', () => {
    const ms = computeOrderAlerts(order(5 * HOUR, { customerName: '' }), 'ms').find((a) => a.id === 'due-now')!;
    expect(ms.title).toBe('Tempahan Sudah Sampai Tempoh!');
    expect(ms.body).toContain('Pelanggan');
    const en = computeOrderAlerts(order(5 * HOUR, { customerName: '' }), 'en').find((a) => a.id === 'due-now')!;
    expect(en.body).toContain('Customer');
  });

  it('does not crash on a record with no state', () => {
    expect(computeOrderAlerts({ id: 'x', timestamp: 1, messages: [] } as any, 'en')).toEqual([]);
  });

  it('does not remind about a deleted order', () => {
    expect(ids(order(5 * HOUR, { isDeleted: true }))).toEqual([]);
  });
});
