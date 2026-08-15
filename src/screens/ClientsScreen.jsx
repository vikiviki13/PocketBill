import { Icon, Topbar } from '../components';
import { DB } from '../db';

export default function ClientsScreen({ onCreate, onEdit }) {
  const clients = DB.getClients();

  return (
    <>
      <Topbar title="Clients" />
      <main className="screen catalog-screen">
        <div className="row-between catalog-heading">
          <div>
            <div className="section-label">Directory</div>
            <h2 className="section-title">Saved clients</h2>
          </div>
          <span className="count-pill">{clients.length}</span>
        </div>
        {clients.length ? clients.map((client) => (
          <button className="catalog-card" type="button" key={client.id} onClick={() => onEdit(client.id)}>
            <span className="catalog-avatar"><Icon name="users" size={20} /></span>
            <span className="catalog-copy">
              <strong>{client.name}</strong>
              <span>{[client.email, client.phone].filter(Boolean).join(' · ') || 'No contact details yet'}</span>
              <span>{[client.city, client.state].filter(Boolean).join(', ') || 'Address not added'}</span>
            </span>
            <span className="catalog-chevron" aria-hidden="true">›</span>
          </button>
        )) : (
          <div className="empty-state catalog-empty">
            <div className="empty-icon"><Icon name="users" size={32} /></div>
            <h2>No clients yet</h2>
            <p>Add a client once and reuse their details on every invoice.</p>
          </div>
        )}
      </main>
      <div className="fab">
        <button className="btn btn-primary" type="button" onClick={onCreate}>+ Add Client</button>
      </div>
    </>
  );
}
