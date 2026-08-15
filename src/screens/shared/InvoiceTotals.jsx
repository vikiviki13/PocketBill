import { money } from '../../utils';

export default function InvoiceTotals({ totals, finalLabel = 'Total Cost' }) {
  return (
    <div className="summary">
      <div className="summary-row"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
      <div className="summary-row"><span>Tax</span><span>{money(totals.tax)}</span></div>
      <div className="summary-row discount"><span>Discount ({totals.discountPct}%)</span><span>-{money(totals.discountAmt)}</span></div>
      <div className="summary-row"><span>Additional Charges</span><span>{money(totals.additional)}</span></div>
      <div className="summary-row total"><span>{finalLabel}</span><span>{money(totals.total)}</span></div>
    </div>
  );
}
