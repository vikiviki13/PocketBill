import { Icon, Topbar } from '../components';
import { DB } from '../db';
import { money } from '../utils';

export default function ItemsScreen({ onCreate, onEdit }) {
  const items = DB.getItems();

  return (
    <>
      <Topbar title="Items & Services" />
      <main className="screen catalog-screen">
        <div className="row-between catalog-heading">
          <div>
            <div className="section-label">Catalog</div>
            <h2 className="section-title">Saved items</h2>
          </div>
          <span className="count-pill">{items.length}</span>
        </div>
        {items.length ? items.map((item) => (
          <button className="catalog-card" type="button" key={item.id} onClick={() => onEdit(item.id)}>
            <span className="catalog-avatar"><Icon name={item.type === 'service' ? 'briefcase' : 'package'} size={20} /></span>
            <span className="catalog-copy">
              <strong>{item.name}</strong>
              <span>{item.type === 'service' ? 'Service' : 'Item'} · {money(item.price)} · {item.tax}% tax</span>
              <span>{item.description || (item.type === 'service' ? 'Ready to add to an invoice' : `${item.unit || 'Pieces'} · Stock ${item.stock || 0}`)}</span>
            </span>
            <span className="catalog-chevron" aria-hidden="true">›</span>
          </button>
        )) : (
          <div className="empty-state catalog-empty">
            <div className="empty-icon"><Icon name="package" size={32} /></div>
            <h2>No items yet</h2>
            <p>Save your products and services to add them to invoices faster.</p>
          </div>
        )}
      </main>
      <div className="fab">
        <button className="btn btn-primary" type="button" onClick={onCreate}>+ Add Item / Service</button>
      </div>
    </>
  );
}
