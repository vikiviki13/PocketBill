import { useState } from 'react';
import { Field, StickyFooter, Topbar } from '../components';
import { DB } from '../db';
import { Sync } from '../sync';
import { isAuthEnabled } from '../supabase';
import { clone } from '../utils';

export default function SettingsScreen({ onBack, onSave, onReset, onSignOut }) {
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
        <p className="footnote">
          {isAuthEnabled
            ? 'Pocketbill works offline and stores a copy on this device. When you are online, changes sync to your account in the cloud.'
            : 'Account access is temporarily disabled. Pocketbill stores your data only on this device.'}
        </p>
        {isAuthEnabled && (
          <>
            <div className="section-label">Account</div>
            <div className="sync-status">
              {Sync.isOnline && !Sync.hasPending() ? 'Connected — cloud sync is up to date' : 'Offline — changes will sync when you are back online'}
            </div>
            <button className="btn btn-outline" type="button" onClick={onSignOut}>Sign out</button>
          </>
        )}
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
