import { Field, Icon, StickyFooter, Topbar } from '../components';
import { DB } from '../db';
import { addDays, computeTotals, daysBetween } from '../utils';
import InvoiceTotals from './shared/InvoiceTotals';

export default function CreateInvoiceScreen({
  draft,
  setDraft,
  onBack,
  onConfig,
  onSelectClient,
  onSelectItem,
  onEditLine,
  onRemoveLine,
  onPayment,
  onGenerate,
}) {
  const client = draft.clientId ? DB.getClient(draft.clientId) : null;
  const business = DB.getBusiness();
  const numberConfig = DB.getConfig();
  const totals = computeTotals(draft);

  const patchDraft = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const changeDate = (date) => patchDraft({ date, dueDate: addDays(date, draft.dueIn) });
  const changeDueDate = (dueDate) => patchDraft({
    dueDate,
    dueIn: Math.max(0, daysBetween(draft.date, dueDate)),
  });
  const changeDueIn = (dueIn) => patchDraft({ dueIn, dueDate: addDays(draft.date, dueIn) });

  return (
    <>
      <Topbar title={draft.id ? 'Edit Invoice' : 'Create Invoice'} onBack={onBack} />
      <main className="screen">
        <div className="section-label">Invoice Number *</div>
        <div className="pill-row">
          {numberConfig.autoGenerate
            ? <span className="pill">{draft.number}</span>
            : <input className="input invoice-number-input" value={draft.number} onChange={(event) => patchDraft({ number: event.target.value })} placeholder="Enter invoice number" aria-label="Invoice number" />}
          <button className="tap-hint button-reset" type="button" onClick={onConfig}>Tap to configure format</button>
        </div>

        <div className="field-row form-gap-top">
          <Field label="Invoice Date *">
            <input className="input" type="date" value={draft.date} onChange={(event) => changeDate(event.target.value)} />
          </Field>
          <Field label="Due Date *">
            <input className="input" type="date" value={draft.dueDate} min={draft.date} onChange={(event) => changeDueDate(event.target.value)} />
          </Field>
        </div>
        <Field label="Due In" hint="Changing ‘Due In’ recalculates ‘Due Date’, and vice versa.">
          <div className="select-wrap">
            <select className="select" value={draft.dueIn} onChange={(event) => changeDueIn(Number(event.target.value))}>
              {[7, 15, 30, 45, 60].map((days) => <option value={days} key={days}>In {days} Days</option>)}
              {!([7, 15, 30, 45, 60].includes(Number(draft.dueIn))) && <option value={draft.dueIn}>In {draft.dueIn} Days</option>}
            </select>
          </div>
        </Field>

        <div className="row-between section-row">
          <div className="section-label">Client *</div>
          <button className="link-action" type="button" onClick={onSelectClient}>+ Add / Change Client</button>
        </div>
        {client
          ? <div className="card compact-card"><strong>{client.name}</strong></div>
          : <div className="hint">No client selected yet.</div>}

        {client && (
          <>
            <div className="section-label">Billing Details</div>
            <div className="card">
              <div className="card-label">Bill To (Client)</div>
              <div className="card-body">{[client.address, `${client.city || ''}${client.pin ? `-${client.pin}` : ''}`, client.state, client.country].filter(Boolean).join(', ')}</div>
              {client.phone && <div className="card-phone">{client.phone}</div>}
            </div>
            <div className="card">
              <div className="card-label">Bill From (You)</div>
              <div className="card-body">{[business.address, `${business.city}${business.pin ? `-${business.pin}` : ''}`, business.state, business.country].filter(Boolean).join(', ')}</div>
              {business.phone && <div className="card-phone">{business.phone}</div>}
            </div>
          </>
        )}

        <div className="row-between section-row">
          <div className="section-label">Item / Service *</div>
          <button className="link-action" type="button" onClick={onSelectItem}>+ Add Item</button>
        </div>
        {draft.lineItems.length ? (
          <div className="table-scroll">
            <table className="items-table">
              <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Amt</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {draft.lineItems.map((item, index) => {
                  const base = Number(item.qty) * Number(item.rate);
                  const total = base + (base * Number(item.tax || 0)) / 100;
                  return (
                    <tr key={item.id}>
                      <td className="item-name">{item.name}</td>
                      <td>{item.qty}</td>
                      <td>{item.rate}</td>
                      <td>{item.tax}%</td>
                      <td><strong>{Math.round(total)}</strong></td>
                      <td>
                        <div className="row-actions">
                          <button type="button" onClick={() => onEditLine(index)} aria-label={`Edit ${item.name}`}><Icon name="edit" size={16} /></button>
                          <button className="danger" type="button" onClick={() => onRemoveLine(index)} aria-label={`Remove ${item.name}`}><Icon name="trash" size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-items">No items added yet. Tap “+ Add Item” to add one.</div>}

        <Field className="form-gap-top">
          <input className="input" type="number" min="0" max="100" inputMode="decimal" placeholder="Add discount (%)" value={draft.discountPct || ''} onChange={(event) => patchDraft({ discountPct: Math.min(100, Math.max(0, Number(event.target.value || 0))) })} aria-label="Discount percentage" />
        </Field>
        <Field>
          <input className="input" type="number" min="0" inputMode="decimal" placeholder="Add Additional Charges" value={draft.additionalCharges || ''} onChange={(event) => patchDraft({ additionalCharges: Math.max(0, Number(event.target.value || 0)) })} aria-label="Additional charges" />
        </Field>
        <InvoiceTotals totals={totals} />

        <Field label="Additional Information" className="form-gap-top">
          <textarea className="textarea" placeholder="Add additional information if required" value={draft.notes || ''} onChange={(event) => patchDraft({ notes: event.target.value })} />
        </Field>
        <button className="btn btn-ghost" type="button" onClick={onPayment}>
          {draft.payment ? <><Icon name="check" size={18} /> Payment details added</> : '+ Add Payment Details if already paid'}
        </button>
      </main>
      <StickyFooter>
        <button className="btn btn-primary" type="button" onClick={onGenerate}>{draft.id ? 'Save Invoice' : 'Generate Invoice'}</button>
      </StickyFooter>
    </>
  );
}
