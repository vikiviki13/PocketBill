export function money(value) {
  return `₹ ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function todayISO() {
  const today = new Date();
  const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function addDays(iso, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return '';
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + Number(days || 0)));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function daysBetween(start, end) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '') || !/^\d{4}-\d{2}-\d{2}$/.test(end || '')) return 0;
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = end.split('-').map(Number);
  const first = Date.UTC(startYear, startMonth - 1, startDay);
  const second = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((second - first) / 86400000);
}

export function formatDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return '—';
  const [year, month, day] = iso.split('-');
  return `${day}-${month}-${year}`;
}

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
}

export function computeTotals(invoice) {
  const lineItems = invoice?.lineItems || [];
  const subtotal = lineItems.reduce((sum, item) => (
    sum + Math.max(0, Number(item.qty) || 0) * Math.max(0, Number(item.rate) || 0)
  ), 0);
  const tax = lineItems.reduce(
    (sum, item) => sum + (
      Math.max(0, Number(item.qty) || 0)
      * Math.max(0, Number(item.rate) || 0)
      * Math.max(0, Number(item.tax) || 0)
    ) / 100,
    0,
  );
  const discountPct = Math.min(100, Math.max(0, Number(invoice?.discountPct) || 0));
  const discountAmt = ((subtotal + tax) * discountPct) / 100;
  const additional = Math.max(0, Number(invoice?.additionalCharges) || 0);
  const total = subtotal + tax - discountAmt + additional;
  return { subtotal, tax, discountAmt, discountPct, additional, total };
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function encodeSharePayload(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function decodeSharePayload(token) {
  try {
    const normalized = token.replaceAll('-', '+').replaceAll('_', '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
