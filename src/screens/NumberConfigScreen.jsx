import { useState } from 'react';
import { Field, StickyFooter, Topbar } from '../components';
import { DB } from '../db';

export default function NumberConfigScreen({ onBack, onSave }) {
  const [config, setConfig] = useState(() => DB.getConfig());
  const patch = (values) => setConfig((current) => ({ ...current, ...values }));

  return (
    <>
      <Topbar title="Invoice Number Config" onBack={onBack} />
      <main className="screen">
        <div className="banner info number-preview">
          <span>Invoice Number Preview</span>
          <strong>{DB.previewNumber(config)}</strong>
        </div>
        <div className="section-title">Set your invoice format once</div>
        <p className="hint intro-hint">Every new invoice will be numbered automatically.</p>
        <div className="toggle-row">
          <div>
            <div className="t-title">Auto-generate invoice number</div>
            <div className="t-sub">New invoices get the next number automatically.</div>
          </div>
          <label className="switch" aria-label="Auto-generate invoice number">
            <input type="checkbox" checked={config.autoGenerate} onChange={(event) => patch({ autoGenerate: event.target.checked })} />
            <span className="track" /><span className="thumb" />
          </label>
        </div>
        <div className="section-label">Number Format</div>
        <Field label="Prefix"><input className="input" value={config.prefix} onChange={(event) => patch({ prefix: event.target.value.toUpperCase() })} maxLength="10" /></Field>
        <Field label="Sequence Length">
          <div className="select-wrap">
            <select className="select" value={config.sequenceLength} onChange={(event) => patch({ sequenceLength: Number(event.target.value) })}>
              {[4, 5, 6, 7, 8].map((length) => <option value={length} key={length}>{length} digits</option>)}
            </select>
          </div>
        </Field>
        <Field label="Starting Number"><input className="input" type="number" min="1" inputMode="numeric" value={config.startingNumber} onChange={(event) => patch({ startingNumber: Number(event.target.value || 1) })} /></Field>
        <Field label="Separator">
          <div className="select-wrap">
            <select className="select" value={config.separator} onChange={(event) => patch({ separator: event.target.value })}>
              {['-', '/', '.', ''].map((separator) => <option value={separator} key={separator || 'none'}>{separator || 'None'}</option>)}
            </select>
          </div>
        </Field>
      </main>
      <StickyFooter>
        <button className="btn btn-primary" type="button" onClick={() => onSave({
          ...config,
          prefix: config.prefix.trim().toUpperCase() || 'INV',
          startingNumber: Math.max(1, Number(config.startingNumber || 1)),
        })}>
          Save
        </button>
      </StickyFooter>
    </>
  );
}
