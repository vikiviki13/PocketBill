import { money } from './utils';

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

export function buildPrintHTML(invoice, client, business, totals) {
  const rows = (invoice.lineItems || []).map((item) => {
    const amount = Number(item.qty) * Number(item.rate);
    const lineTotal = amount + (amount * Number(item.tax || 0)) / 100;
    return `
      <tr>
        <td>${escapeHTML(item.name)}</td>
        <td>${escapeHTML(item.qty)}</td>
        <td>${money(item.rate)}</td>
        <td>${escapeHTML(item.tax)}%</td>
        <td>${money(lineTotal)}</td>
      </tr>`;
  }).join('');

  const payment = invoice.payment ? `
    <section class="print-payment">
      <h3>Payment Details</h3>
      <div><span>Payment date</span><strong>${escapeHTML(invoice.payment.date || '—')}</strong></div>
      <div><span>Payment method</span><strong>${escapeHTML(invoice.payment.method || '—')}</strong></div>
      <div><span>Reference number</span><strong>${escapeHTML(invoice.payment.reference || '—')}</strong></div>
      <div class="print-total"><span>Total paid amount</span><strong>${money(invoice.payment.amount)}</strong></div>
    </section>` : '';

  return `
    <article class="print-invoice">
      <header>
        <div><h1>INVOICE</h1><p>${escapeHTML(invoice.number)}</p></div>
        <div class="print-logo">${escapeHTML(business.logoInitial || 'PB')}</div>
      </header>
      <section class="print-parties">
        <div>
          <h2>Bill From</h2>
          <strong>${escapeHTML(business.name)}</strong>
          <p>${escapeHTML(business.address)}, ${escapeHTML(business.city)}-${escapeHTML(business.pin)}, ${escapeHTML(business.state)}, ${escapeHTML(business.country)}</p>
          <p>${escapeHTML(business.phone)}</p>
        </div>
        <div>
          <h2>Bill To</h2>
          <strong>${escapeHTML(client.name)}</strong>
          <p>${escapeHTML(client.email || '')}</p>
          <p>${escapeHTML(client.phone || '')}</p>
        </div>
      </section>
      <section class="print-dates"><span><strong>Issued:</strong> ${escapeHTML(invoice.date)}</span><span><strong>Due:</strong> ${escapeHTML(invoice.dueDate)}</span></section>
      <table>
        <thead><tr><th>Item / Service</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <section class="print-summary">
        <div><span>Subtotal</span><span>${money(totals.subtotal)}</span></div>
        <div><span>Total GST</span><span>${money(totals.tax)}</span></div>
        <div><span>Discount (${totals.discountPct || 0}%)</span><span>-${money(totals.discountAmt)}</span></div>
        <div><span>Additional charges</span><span>${money(totals.additional)}</span></div>
        <div class="print-total"><span>Total</span><strong>${money(totals.total)}</strong></div>
      </section>
      ${invoice.notes ? `<p class="print-notes"><strong>Notes:</strong> ${escapeHTML(invoice.notes)}</p>` : ''}
      ${payment}
      <footer>Generated with Pocketbill</footer>
    </article>`;
}

export function printInvoice(invoice, client, business, totals) {
  const printArea = document.getElementById('print-area');
  if (!printArea) return;
  printArea.innerHTML = buildPrintHTML(invoice, client, business, totals);
  const previousTitle = document.title;
  document.title = `${invoice.number}.pdf`;
  window.print();
  window.setTimeout(() => { document.title = previousTitle; }, 500);
}
