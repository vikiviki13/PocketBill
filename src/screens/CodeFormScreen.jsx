import { useState } from 'react';
import { Field, StickyFooter, Topbar } from '../components';

export default function CodeFormScreen({ initialKind, onBack, onSave }) {
  const [kind, setKind] = useState(initialKind || 'hsn');
  const [form, setForm] = useState({ code: '', tax: 18, description: '' });
  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <>
      <Topbar title={`Create ${kind.toUpperCase()}`} onBack={onBack} />
      <main className="screen">
        <div className="tabs" role="tablist" aria-label="Code type">
          <button className={kind === 'hsn' ? 'active' : ''} type="button" role="tab" aria-selected={kind === 'hsn'} onClick={() => setKind('hsn')}>HSN</button>
          <button className={kind === 'sac' ? 'active' : ''} type="button" role="tab" aria-selected={kind === 'sac'} onClick={() => setKind('sac')}>SAC</button>
        </div>
        <Field label={`${kind.toUpperCase()} Number *`}><input className="input" inputMode="numeric" placeholder="e.g. 1234" value={form.code} onChange={(event) => patch('code', event.target.value)} autoFocus /></Field>
        <Field label="Tax"><input className="input" type="number" min="0" inputMode="decimal" value={form.tax} onChange={(event) => patch('tax', Number(event.target.value || 0))} /></Field>
        <Field label="Description (Optional)"><textarea className="textarea" placeholder="Add a short description" value={form.description} onChange={(event) => patch('description', event.target.value)} /></Field>
      </main>
      <StickyFooter>
        <button className="btn btn-primary" type="button" onClick={() => onSave(kind, { ...form, tax: Math.max(0, Number(form.tax || 0)), code: form.code.trim(), description: form.description.trim() })}>Save</button>
      </StickyFooter>
    </>
  );
}
