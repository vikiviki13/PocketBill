import { Icon } from '../components';

export default function InvoiceActionsSheet({ invoice, onDuplicate, onTogglePaid, onPrint, onEdit, onCancel, onDelete }) {
  return (
    <div className="action-list">
      <button className="sheet-action-row" type="button" onClick={onDuplicate}><Icon name="copy" /><span>Duplicate Invoice</span></button>
      {invoice.status !== 'cancelled' && (
        <button className="sheet-action-row success" type="button" onClick={onTogglePaid}><Icon name="check" /><span>{invoice.status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}</span></button>
      )}
      <button className="sheet-action-row" type="button" onClick={onPrint}><Icon name="download" /><span>Download PDF</span></button>
      <button className="sheet-action-row" type="button" onClick={onEdit}><Icon name="edit" /><span>Edit Invoice</span></button>
      <button className="sheet-action-row danger" type="button" onClick={onCancel}><Icon name="ban" /><span>{invoice.status === 'cancelled' ? 'Reopen Invoice' : 'Cancel Invoice'}</span></button>
      <button className="sheet-action-row danger" type="button" onClick={onDelete}><Icon name="trash" /><span>Delete</span></button>
    </div>
  );
}
