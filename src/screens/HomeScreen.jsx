import { Icon, Topbar } from '../components';
import { DB } from '../db';
import { computeTotals, formatDate, initials, money } from '../utils';

export default function HomeScreen({ onNew, onOpen, onSettings }) {
  const invoices = DB.getInvoices();
  const clients = DB.getClients();
  const clientMap = Object.fromEntries(clients.map((client) => [client.id, client]));

  return (
    <>
      <Topbar
        title="Pocketbill"
        action={(
          <button className="icon-btn" type="button" onClick={onSettings} aria-label="Business settings">
            <Icon name="settings" />
          </button>
        )}
      />
      <main className="screen home-screen">
        <div className="section-label">Invoices</div>
        {invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="receipt" size={34} /></div>
            <h2>No invoices yet</h2>
            <p>Create your first invoice to get started. It only takes a minute.</p>
          </div>
        ) : invoices.map((invoice) => {
          const client = clientMap[invoice.clientId] || { name: 'Unknown client' };
          const totals = computeTotals(invoice);
          return (
            <button className="inv-card" type="button" key={invoice.id} onClick={() => onOpen(invoice.id)}>
              <div className="inv-avatar">{initials(client.name)}</div>
              <div className="inv-info">
                <div className="name">{client.name}</div>
                <div className="meta">{invoice.number} · {formatDate(invoice.date)}</div>
              </div>
              <div className="inv-amt">
                <div className="amt">{money(totals.total)}</div>
                <span className={`status-badge status-${invoice.status}`}>{invoice.status}</span>
              </div>
            </button>
          );
        })}
      </main>
      <div className="fab">
        <button className="btn btn-primary" type="button" onClick={onNew}>+ New Invoice</button>
      </div>
    </>
  );
}
