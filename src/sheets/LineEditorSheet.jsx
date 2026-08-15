import { useState } from 'react';
import { Field } from '../components';
import { clone } from '../utils';

export default function LineEditorSheet({ line, onSave }) {
  const [form, setForm] = useState(() => clone(line));
  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="sheet-form">
      <Field label="Quantity"><input className="input" type="number" min="1" inputMode="numeric" value={form.qty} onChange={(event) => patch('qty', event.target.value)} autoFocus /></Field>
      <Field label="Rate"><input className="input" type="number" min="0" inputMode="decimal" value={form.rate} onChange={(event) => patch('rate', event.target.value)} /></Field>
      <Field label="Tax %"><input className="input" type="number" min="0" inputMode="decimal" value={form.tax} onChange={(event) => patch('tax', event.target.value)} /></Field>
      <button className="btn btn-primary" type="button" onClick={() => onSave({
        ...form,
        qty: Math.max(1, Number(form.qty || 1)),
        rate: Math.max(0, Number(form.rate || 0)),
        tax: Math.max(0, Number(form.tax || 0)),
      })}>
        Update Item
      </button>
    </div>
  );
}
