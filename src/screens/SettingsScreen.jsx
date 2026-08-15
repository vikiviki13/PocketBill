import { useState } from 'react';
import { Field, StickyFooter, Topbar } from '../components';
import { DB } from '../db';
import { clone } from '../utils';

export default function SettingsScreen({ onBack, onSave, onReset }) {
  const [form, setForm] = useState(() => clone(DB.getBusiness()));
  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <>
      <Topbar title="Business Profile" onBack={onBack} />
      <main className="screen">
        <p className="hint settings-intro">This information appears as “Bill From” on every invoice you create.</p>
        <Field label="Business Name *"><input className="input" value={form.name} onChange={(event) => patch('name', event.target.value)} /></Field>
        <Field label="Logo Initials"><input className="input" maxLength="2" value={form.logoInitial} onChange={(event) => patch('logoInitial', event.target.value.toUpperCase())} /></Field>
        <Field label="Email"><input className="input" type="email" inputMode="email" value={form.email} onChange={(event) => patch('email', event.target.value)} /></Field>
        <Field label="Phone Number"><input className="input" type="tel" inputMode="tel" value={form.phone} onChange={(event) => patch('phone', event.target.value)} /></Field>
        <Field label="Address Line"><input className="input" value={form.address} onChange={(event) => patch('address', event.target.value)} /></Field>
        <div className="field-row">
          <Field label="City"><input className="input" value={form.city} onChange={(event) => patch('city', event.target.value)} /></Field>
          <Field label="PIN Code"><input className="input" inputMode="numeric" value={form.pin} onChange={(event) => patch('pin', event.target.value)} /></Field>
        </div>
        <div className="field-row">
          <Field label="State"><input className="input" value={form.state} onChange={(event) => patch('state', event.target.value)} /></Field>
          <Field label="Country"><input className="input" value={form.country} onChange={(event) => patch('country', event.target.value)} /></Field>
        </div>
        <div className="section-label">Data</div>
        <button className="btn btn-danger" type="button" onClick={onReset}>Erase all local data</button>
        <p className="footnote">Pocketbill stores everything on this device only. Nothing is uploaded to a server.</p>
      </main>
      <StickyFooter>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => onSave({
            ...form,
            name: form.name.trim() || 'Your Business',
            logoInitial: form.logoInitial.trim().toUpperCase() || 'PB',
            country: form.country.trim() || 'India',
          })}
        >
          Save
        </button>
      </StickyFooter>
    </>
  );
}
