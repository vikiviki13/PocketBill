import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  computeTotals,
  daysBetween,
  decodeSharePayload,
  encodeSharePayload,
  formatDate,
} from '../src/utils.js';

test('date calculations are independent of the device timezone', () => {
  assert.equal(addDays('2026-08-15', 7), '2026-08-22');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2024-02-29', 1), '2024-03-01');
  assert.equal(daysBetween('2026-08-15', '2026-08-22'), 7);
  assert.equal(daysBetween('2026-08-22', '2026-08-15'), -7);
  assert.equal(addDays('', 7), '');
  assert.equal(daysBetween('', '2026-08-15'), 0);
});

test('invoice totals include GST, discount, and additional charges', () => {
  const totals = computeTotals({
    lineItems: [
      { qty: 2, rate: 100, tax: 18 },
      { qty: 1, rate: 50, tax: 5 },
    ],
    discountPct: 10,
    additionalCharges: 25,
  });

  assert.equal(totals.subtotal, 250);
  assert.equal(totals.tax, 38.5);
  assert.equal(totals.discountAmt, 28.85);
  assert.equal(totals.total, 284.65);
});

test('invoice totals clamp invalid negative values and excessive discounts', () => {
  const totals = computeTotals({
    lineItems: [{ qty: -2, rate: 100, tax: -18 }],
    discountPct: 250,
    additionalCharges: -25,
  });

  assert.deepEqual(totals, {
    subtotal: 0,
    tax: 0,
    discountAmt: 0,
    discountPct: 100,
    additional: 0,
    total: 0,
  });
});

test('portable share payloads preserve Unicode invoice data', () => {
  const payload = {
    invoice: { number: 'PB-0000001', notes: 'Paid ₹500' },
    client: { name: 'Āsha & Co.' },
    business: { name: 'Pocketbill' },
  };
  assert.deepEqual(decodeSharePayload(encodeSharePayload(payload)), payload);
});

test('display dates are formatted consistently', () => {
  assert.equal(formatDate('2026-08-15'), '15-08-2026');
  assert.equal(formatDate(''), '—');
  assert.equal(formatDate('not-a-date'), '—');
});
