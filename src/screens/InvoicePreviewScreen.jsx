import { Icon, StickyFooter, Topbar } from '../components';
import { computeTotals, formatDate, money } from '../utils';
import InvoiceTotals from './shared/InvoiceTotals';

function InvoiceDocument({ invoice, client, business, totals }) {
  return (
    <article className="invoice-doc">
      <div className="doc-head">
        <div><h2>INVOICE</h2><div className="doc-num">{invoice.number}</div></div>
        <div className="badge-square">{business.logoInitial || 'PB'}</div>
      </div>

      <div className="doc-cols">
        <div className="doc-col">
          <h3>Bill To</h3>
          <p className="strong">{client.name}</p>
          {client.email && <p>{client.email}</p>}
          {client.phone && <p>{client.phone}</p>}
        </div>
        <div className="doc-col right">
          <h3>Dates</h3>
          <p>Issued: {formatDate(invoice.date)}</p>
          <p className="strong">Due: {formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      <div className="table-scroll doc-table-wrap">
        <table className="doc-table">
          <thead><tr><th>Item / Service</th><th>Qty</th><th>Rate (₹)</th><th>Tax</th><th>Total (₹)</th></tr></thead>
          <tbody>
            {(invoice.lineItems || []).map((item, index) => {
              const base = Number(item.qty) * Number(item.rate);
              const total = base + (base * Number(item.tax || 0)) / 100;
              return <tr key={item.id || `${item.name}-${index}`}><td>{item.name}</td><td>{item.qty}</td><td>{item.rate}</td><td>{item.tax}%</td><td>{Math.round(total)}</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="doc-summary"><InvoiceTotals totals={totals} finalLabel="Total Invoice Amount" /></div>
      {invoice.notes && <div className="doc-notes"><strong>Notes</strong><p>{invoice.notes}</p></div>}
      {invoice.payment && (
        <div className="doc-paydetails">
          <h3>Payment Details</h3>
          <div className="summary-row"><span>Payment Date</span><span>{formatDate(invoice.payment.date)}</span></div>
          <div className="summary-row"><span>Payment Method</span><span>{invoice.payment.method}</span></div>
          <div className="summary-row"><span>Reference Number</span><span>{invoice.payment.reference || '—'}</span></div>
          <div className="summary-row total"><span>Total Paid Amount</span><span>{money(invoice.payment.amount)}</span></div>
        </div>
      )}
    </article>
  );
}

export default function InvoicePreviewScreen({
  invoice,
  client,
  business,
  shared = false,
  onBack,
  onActions,
  onShare,
  onCopy,
  onPrint,
}) {
  const totals = computeTotals(invoice);
  const banner = invoice.status === 'paid'
    ? <div className="banner success">Payment Received</div>
    : invoice.status === 'partial'
      ? <div className="banner warning">Partially Paid</div>
      : invoice.status === 'cancelled'
        ? <div className="banner danger-banner">Cancelled</div>
        : <div className="banner info">{shared ? `Invoice from ${business.name}` : `Ready to share with ${client.name}`}</div>;

  return (
    <>
      <Topbar title={shared ? 'Shared Invoice' : 'Invoice Preview'} onBack={onBack} />
      <main className="screen">
        {banner}
        <InvoiceDocument invoice={invoice} client={client} business={business} totals={totals} />
        {!shared && (
          <button className="share-link" type="button" onClick={onCopy}>
            <Icon name="link" size={17} /> Copy client share link
          </button>
        )}
      </main>
      <StickyFooter className="btn-row">
        {shared
          ? <button className="btn btn-outline" type="button" onClick={onPrint}><Icon name="download" size={18} /> Print / PDF</button>
          : <button className="btn btn-outline" type="button" onClick={onActions}>More Actions</button>}
        <button className="btn btn-primary" type="button" onClick={onShare}><Icon name="share" size={18} /> Share Invoice</button>
      </StickyFooter>
    </>
  );
}
