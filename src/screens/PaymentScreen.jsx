import { useState } from 'react';
import { Field, StickyFooter, Topbar } from '../components';
import { clone, computeTotals, todayISO } from '../utils';

export default function PaymentScreen({ draft, onBack, onSave }) {
  const totals = computeTotals(draft);
  const [form, setForm] = useState(() => clone(draft.payment || {
    amount: totals.total.toFixed(2),
    date: todayISO(),
    method: 'UPI',
    reference: '',
    notes: '',
  }));
  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <>
      <Topbar title="Payment Details" onBack={onBack} />
      <main className="screen">
        <div className="banner info number-preview"><span>Invoice Number</span><strong>{draft.number}</strong></div>
        <div className="section-title">Payment Details</div>
        <Field label="Amount Paid"><input className="input" type="number" min="0" inputMode="decimal" value={form.amount} onChange={(event) => patch('amount', event.target.value)} /></Field>
        <Field label="Payment Date *"><input className="input" type="date" value={form.date} onChange={(event) => patch('date', event.target.value)} /></Field>
        <Field label="Payment Method *">
          <div className="select-wrap">
            <select className="select" value={form.method} onChange={(event) => patch('method', event.target.value)}>
              {['UPI', 'Cash', 'Bank Transfer', 'Card', 'Cheque', 'Other'].map((method) => <option key={method}>{method}</option>)}
            </select>
          </div>
        </Field>
        <Field label="Reference Number"><input className="input" value={form.reference} onChange={(event) => patch('reference', event.target.value)} /></Field>
        <Field label="Notes"><textarea className="textarea" placeholder="Add a note" value={form.notes} onChange={(event) => patch('notes', event.target.value)} /></Field>
      </main>
      <StickyFooter>
        <button className="btn btn-primary" type="button" onClick={() => onSave({ ...form, amount: Math.max(0, Number(form.amount || 0)), reference: form.reference.trim(), notes: form.notes.trim() })}>Save</button>
      </StickyFooter>
    </>
  );
}
