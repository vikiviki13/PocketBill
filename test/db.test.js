import test from 'node:test';
import assert from 'node:assert/strict';
import { DB } from '../src/db.js';

function createLocalStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

test('explicit data reset remains empty instead of restoring demo records', () => {
  global.localStorage = createLocalStorage();
  DB.seedIfNeeded();
  assert.ok(DB.getClients().length > 0);
  assert.ok(DB.getItems().length > 0);

  DB.resetAll();
  DB.seedIfNeeded();

  assert.deepEqual(DB.getClients(), []);
  assert.deepEqual(DB.getItems(), []);
  assert.deepEqual(DB.getInvoices(), []);
});

test('invoice persistence updates existing records without duplication', () => {
  global.localStorage = createLocalStorage();
  const saved = DB.saveInvoice({ number: 'PB-1', lineItems: [] });
  DB.saveInvoice({ ...saved, status: 'paid' });

  assert.equal(DB.getInvoices().length, 1);
  assert.equal(DB.getInvoice(saved.id).status, 'paid');
});

test('corrupt or partial stored data falls back to a safe schema', () => {
  global.localStorage = createLocalStorage();
  localStorage.setItem('pb_clients', JSON.stringify({ invalid: true }));
  localStorage.setItem('pb_invoice_config', JSON.stringify({ prefix: 'INV' }));

  assert.deepEqual(DB.getClients(), []);
  assert.deepEqual(DB.getConfig(), {
    autoGenerate: true,
    prefix: 'INV',
    sequenceLength: 7,
    startingNumber: 1,
    separator: '-',
    nextNumber: 1,
  });
});
