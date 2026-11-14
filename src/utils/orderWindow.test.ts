import { describe, expect, it } from 'vitest';
import type { OrderHistoryItem } from '../types';
import {
  getActiveOrderWindow,
  getOrderDueTimestamp,
  isActivePendingOrder,
  isOrderInsideActiveWindow,
  removeStalePendingOrders,
} from './orderWindow';

// Reference "today": Sat 14 Nov 2026, 10:00 Malaysia time.
const NOW = new Date(2026, 10, 14, 10, 0, 0);
const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

function order(state: Record<string, unknown>, extra: Partial<OrderHistoryItem> = {}): OrderHistoryItem {
  return { id: 'o1', timestamp: 1, messages: [], state: state as any, ...extra } as OrderHistoryItem;
}

describe('test environment', () => {
  it('runs in Malaysia time', () => {
    expect(new Date(2026, 10, 14, 10, 0).toISOString()).toBe('2026-11-14T02:00:00.000Z');
  });
});

describe('getOrderDueTimestamp', () => {
  it('prefers the stored dueTimestamp', () => {
    expect(getOrderDueTimestamp(order({ dueTimestamp: 1234567890000, customerDue: '01/01/2030' }))).toBe(1234567890000);
  });

  it('accepts a numeric string timestamp', () => {
    expect(getOrderDueTimestamp(order({ dueTimestamp: '1234567890000' }))).toBe(1234567890000);
  });

  it('falls back to parsing customerDue (day/month/year, not month/day)', () => {
    expect(getOrderDueTimestamp(order({ customerDue: '06/07/2026 8:30 PM' }))).toBe(at(2026, 7, 6, 20, 30));
  });

  it('ignores zero, negative and non-numeric stored timestamps', () => {
    expect(getOrderDueTimestamp(order({ dueTimestamp: 0 }))).toBeNull();
    expect(getOrderDueTimestamp(order({ dueTimestamp: -5 }))).toBeNull();
    expect(getOrderDueTimestamp(order({ dueTimestamp: 'abc' }))).toBeNull();
  });

  it('returns null when there is no usable due date', () => {
    expect(getOrderDueTimestamp(order({}))).toBeNull();
    expect(getOrderDueTimestamp(order({ customerDue: '   ' }))).toBeNull();
    expect(getOrderDueTimestamp(order({ customerDue: 'soon, maybe' }))).toBeNull();
  });

  it('never uses the order creation time as the due date', () => {
    expect(getOrderDueTimestamp(order({}, { timestamp: NOW.getTime() }))).toBeNull();
  });

  it('does not crash on a record with no state', () => {
    expect(getOrderDueTimestamp({ id: 'x', timestamp: 1, messages: [] } as any)).toBeNull();
  });
});

describe('getActiveOrderWindow', () => {
  it('starts at midnight two days ago and ends 23:59:59.999 three days ahead', () => {
    const { startTimestamp, endTimestamp } = getActiveOrderWindow(NOW);
    expect(startTimestamp).toBe(at(2026, 11, 12, 0, 0));
    expect(endTimestamp).toBe(new Date(2026, 10, 17, 23, 59, 59, 999).getTime());
  });

  it('crosses month and year boundaries correctly', () => {
    const w = getActiveOrderWindow(new Date(2026, 11, 31, 12, 0));
    expect(w.startTimestamp).toBe(at(2026, 12, 29, 0, 0));
    expect(w.endTimestamp).toBe(new Date(2027, 0, 3, 23, 59, 59, 999).getTime());
  });

  it('does not change the date passed in', () => {
    const ref = new Date(NOW);
    getActiveOrderWindow(ref);
    expect(ref.getTime()).toBe(NOW.getTime());
  });
});

describe('isOrderInsideActiveWindow', () => {
  const inside = (due: number) => isOrderInsideActiveWindow(order({ dueTimestamp: due }), NOW);

  it('includes the exact window edges', () => {
    expect(inside(at(2026, 11, 12, 0, 0))).toBe(true);
    expect(inside(new Date(2026, 10, 17, 23, 59, 59, 999).getTime())).toBe(true);
  });

  it('excludes one millisecond outside the edges', () => {
    expect(inside(at(2026, 11, 12, 0, 0) - 1)).toBe(false);
    expect(inside(new Date(2026, 10, 18, 0, 0, 0, 0).getTime())).toBe(false);
  });

  it('is false when the order has no due date', () => {
    expect(isOrderInsideActiveWindow(order({}), NOW)).toBe(false);
  });
});

describe('isActivePendingOrder', () => {
  it('is true for an undelivered, undeleted order', () => {
    expect(isActivePendingOrder(order({ dueTimestamp: at(2026, 11, 15, 9) }))).toBe(true);
  });

  it('is false for delivered, deleted or state-less orders', () => {
    expect(isActivePendingOrder(order({ isDelivered: true }))).toBe(false);
    expect(isActivePendingOrder(order({ isDeleted: true }))).toBe(false);
    expect(isActivePendingOrder({ id: 'x', timestamp: 1, messages: [] } as any)).toBe(false);
  });
});

describe('removeStalePendingOrders', () => {
  const keep = (state: Record<string, unknown>) => removeStalePendingOrders([order(state)], NOW).length === 1;

  it('removes unfinished orders due before the window start', () => {
    expect(keep({ dueTimestamp: at(2026, 11, 11, 23, 59) })).toBe(false);
  });

  it('keeps unfinished orders due at or after the window start', () => {
    expect(keep({ dueTimestamp: at(2026, 11, 12, 0, 0) })).toBe(true);
    expect(keep({ dueTimestamp: at(2026, 11, 20) })).toBe(true);
  });

  it('keeps old delivered and deleted orders as history', () => {
    expect(keep({ dueTimestamp: at(2026, 1, 1), isDelivered: true })).toBe(true);
    expect(keep({ dueTimestamp: at(2026, 1, 1), isDeleted: true })).toBe(true);
  });

  it('never removes an order whose due date is unknown', () => {
    expect(keep({})).toBe(true);
    expect(keep({ customerDue: 'not a date' })).toBe(true);
  });

  it('drops empty/invalid records and does not modify the input array', () => {
    const input = [order({ dueTimestamp: at(2026, 11, 15) }), null as any, { id: 'n' } as any];
    const out = removeStalePendingOrders(input, NOW);
    expect(out).toHaveLength(1);
    expect(input).toHaveLength(3);
  });
});
