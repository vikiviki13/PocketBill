import { useState } from 'react';
import { Field, StickyFooter, Topbar } from '../components';
import { DB } from '../db';
import { clone } from '../utils';

const blankClient = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  pin: '',
  state: '',
  country: 'India',
};

export default function ClientFormScreen({ clientId, onBack, onSave }) {
  const [form, setForm] = useState(() => clone(clientId ? DB.getClient(clientId) : blankClient));
  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <>
      <Topbar title={clientId ? 'Edit Client' : 'Create Client'} onBack={onBack} />
      <main className="screen">
        <div className="section-title">Client Details</div>
        <Field label="Name / Business Name *"><input className="input" placeholder="Client or business name" value={form.name} onChange={(event) => patch('name', event.target.value)} autoFocus /></Field>
        <Field label="Email Address"><input className="input" type="email" inputMode="email" placeholder="name@example.com" value={form.email} onChange={(event) => patch('email', event.target.value)} /></Field>
        <Field label="Phone Number"><input className="input" type="tel" inputMode="tel" placeholder="+91 00000 00000" value={form.phone} onChange={(event) => patch('phone', event.target.value)} /></Field>

        <div className="section-title sub-section">Billing Address</div>
        <Field label="Address Line"><input className="input" placeholder="Street, area" value={form.address} onChange={(event) => patch('address', event.target.value)} /></Field>
        <div className="field-row">
          <Field label="City"><input className="input" value={form.city} onChange={(event) => patch('city', event.target.value)} /></Field>
          <Field label="PIN Code"><input className="input" inputMode="numeric" value={form.pin} onChange={(event) => patch('pin', event.target.value)} /></Field>
        </div>
        <div className="field-row">
          <Field label="State"><input className="input" value={form.state} onChange={(event) => patch('state', event.target.value)} /></Field>
          <Field label="Country"><input className="input" value={form.country} onChange={(event) => patch('country', event.target.value)} /></Field>
        </div>
      </main>
      <StickyFooter>
        <button className="btn btn-primary" type="button" onClick={() => onSave({ ...form, name: form.name.trim(), country: form.country.trim() || 'India' })}>Save &amp; Use Client</button>
      </StickyFooter>
    </>
  );
}
