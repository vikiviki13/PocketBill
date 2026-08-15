import { Field, StickyFooter, Topbar } from '../components';

export default function ItemFormScreen({ form, setForm, onBack, onSelectCode, onCreateCode, onSave }) {
  const isService = form.type === 'service';
  const code = isService ? form.sac : form.hsn;
  const patch = (values) => setForm((current) => ({ ...current, ...values }));

  return (
    <>
      <Topbar title={`${form.id ? 'Edit' : 'Create'} ${isService ? 'Service' : 'Item'}`} onBack={onBack} />
      <main className="screen">
        <div className="tabs" role="tablist" aria-label="Entry type">
          <button className={!isService ? 'active' : ''} type="button" role="tab" aria-selected={!isService} onClick={() => patch({ type: 'item' })}>Item</button>
          <button className={isService ? 'active' : ''} type="button" role="tab" aria-selected={isService} onClick={() => patch({ type: 'service' })}>Service</button>
        </div>
        <Field label={isService ? 'Service Name *' : 'Item Name *'}>
          <input className="input" placeholder={isService ? 'Service Name' : 'Item Name'} value={form.name} onChange={(event) => patch({ name: event.target.value })} autoFocus />
        </Field>
        <Field label={isService ? 'Service Price' : 'Selling Price'}>
          <input className="input" type="number" min="0" inputMode="decimal" value={form.price} onChange={(event) => patch({ price: event.target.value })} />
        </Field>

        <div className="row-between section-row">
          <div className="section-label">{isService ? 'SAC Number' : 'HSN Number'}</div>
          <button className="link-action" type="button" onClick={() => onCreateCode(isService ? 'sac' : 'hsn')}>+ Create {isService ? 'SAC' : 'HSN'}</button>
        </div>
        <button className="select-field" type="button" onClick={() => onSelectCode(isService ? 'sac' : 'hsn')}>
          <span>{code || `Select a ${isService ? 'SAC' : 'HSN'} code`}</span><span>›</span>
        </button>
        <Field label="Tax"><input className="input" type="number" min="0" inputMode="decimal" value={form.tax} onChange={(event) => patch({ tax: event.target.value })} /></Field>

        {!isService && (
          <div className="field-row">
            <Field label="Unit">
              <div className="select-wrap">
                <select className="select" value={form.unit} onChange={(event) => patch({ unit: event.target.value })}>
                  {['Pieces', 'Kg', 'Litre', 'Box', 'Hours', 'Meter'].map((unit) => <option key={unit}>{unit}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Opening Stock"><input className="input" type="number" min="0" inputMode="numeric" value={form.stock} onChange={(event) => patch({ stock: event.target.value })} /></Field>
          </div>
        )}

        <Field label="Description (Optional)">
          <textarea className="textarea" placeholder="Add a short description" value={form.description} onChange={(event) => patch({ description: event.target.value })} />
        </Field>
      </main>
      <StickyFooter>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => onSave({
            ...form,
            name: form.name.trim(),
            price: Math.max(0, Number(form.price || 0)),
            tax: Math.max(0, Number(form.tax || 0)),
            stock: isService ? 0 : Math.max(0, Number(form.stock || 0)),
            unit: isService ? '' : form.unit,
            hsn: isService ? '' : form.hsn,
            sac: isService ? form.sac : '',
          })}
        >
          Save &amp; Use {isService ? 'Service' : 'Item'}
        </button>
      </StickyFooter>
    </>
  );
}
