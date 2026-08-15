import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomSheet, Toast } from './components';
import { DB } from './db';
import { Sync } from './sync';
import { printInvoice } from './pdf';
import {
  ClientFormScreen,
  CodeFormScreen,
  CreateInvoiceScreen,
  HomeScreen,
  InvoicePreviewScreen,
  ItemFormScreen,
  NumberConfigScreen,
  PaymentScreen,
  SettingsScreen,
} from './screens';
import {
  ClientPickerSheet,
  CodePickerSheet,
  InvoiceActionsSheet,
  ItemPickerSheet,
  LineEditorSheet,
} from './sheets';
import {
  addDays,
  clone,
  computeTotals,
  daysBetween,
  decodeSharePayload,
  encodeSharePayload,
  formatDate,
  money,
  todayISO,
} from './utils';

const blankItem = {
  type: 'item',
  name: '',
  price: '',
  hsn: '',
  sac: '',
  tax: '',
  unit: 'Pieces',
  stock: 0,
  description: '',
};

function createInvoiceDraft() {
  const date = todayISO();
  const config = DB.getConfig();
  return {
    id: null,
    number: config.autoGenerate ? DB.nextInvoiceNumber() : '',
    date,
    dueIn: 7,
    dueDate: addDays(date, 7),
    clientId: null,
    lineItems: [],
    discountPct: 0,
    additionalCharges: 0,
    notes: '',
    payment: null,
    status: 'draft',
  };
}

function getInitialRoute() {
  const hash = window.location.hash;

  if (hash.startsWith('#share=')) {
    const payload = decodeSharePayload(hash.slice(7));
    if (
      payload?.invoice
      && Array.isArray(payload.invoice.lineItems)
      && typeof payload.invoice.number === 'string'
      && payload?.client
      && payload?.business
    ) {
      return { view: 'sharedPreview', params: { payload } };
    }
  }

  if (hash.startsWith('#invoice=')) {
    const invoiceId = decodeURIComponent(hash.slice(9));
    if (DB.getInvoice(invoiceId)) {
      return { view: 'invoicePreview', params: { invoiceId } };
    }
  }

  return { view: 'home', params: {} };
}

export default function App() {
  const [stack, setStack] = useState(() => [getInitialRoute()]);
  const [draft, setDraft] = useState(null);
  const [itemDraft, setItemDraft] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [, setDataVersion] = useState(0);
  const toastTimer = useRef(null);
  const route = stack[stack.length - 1];

  const showToast = useCallback((message) => {
    window.clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = window.setTimeout(() => setToastMessage(''), 2400);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route.view, route.params]);

  const navigate = (view, params = {}) => {
    setStack((current) => [...current, { view, params }]);
  };

  const replace = (view, params = {}) => {
    setStack((current) => [...current.slice(0, -1), { view, params }]);
  };

  const goBack = () => {
    setStack((current) => (
      current.length > 1 ? current.slice(0, -1) : [{ view: 'home', params: {} }]
    ));
  };

  const goHome = () => {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    setStack([{ view: 'home', params: {} }]);
    setDraft(null);
    setSheet(null);
  };

  const refreshData = () => setDataVersion((version) => version + 1);
  const closeSheet = useCallback(() => setSheet(null), []);

  const addSavedItem = (item) => {
    setDraft((current) => {
      const existing = current.lineItems.find((line) => line.refItemId === item.id);
      const lineItems = existing
        ? current.lineItems.map((line) => (
          line.refItemId === item.id ? { ...line, qty: Number(line.qty) + 1 } : line
        ))
        : [...current.lineItems, {
          id: DB.uid('line'),
          refItemId: item.id,
          name: item.name,
          qty: 1,
          rate: item.price,
          tax: item.tax,
        }];
      return { ...current, lineItems };
    });
    showToast(`${item.name} added`);
  };

  const generateInvoice = () => {
    const invoiceNumber = draft.number.trim();
    if (!invoiceNumber) {
      showToast('Please enter an invoice number');
      return;
    }
    if (!draft.date || !draft.dueDate) {
      showToast('Please select invoice and due dates');
      return;
    }
    if (daysBetween(draft.date, draft.dueDate) < 0) {
      showToast('Due date cannot be before invoice date');
      return;
    }
    if (!draft.clientId) {
      showToast('Please select a client');
      return;
    }
    if (!draft.lineItems.length) {
      showToast('Please add at least one item or service');
      return;
    }

    const numberExists = DB.getInvoices().some((invoice) => (
      invoice.id !== draft.id
      && String(invoice.number).toLowerCase() === invoiceNumber.toLowerCase()
    ));
    if (numberExists) {
      showToast('That invoice number is already in use');
      return;
    }

    const isNew = !draft.id;
    const numberConfig = DB.getConfig();
    const totals = computeTotals(draft);
    const paidAmount = Math.max(0, Number(draft.payment?.amount) || 0);
    const status = paidAmount <= 0
      ? 'unpaid'
      : (paidAmount >= totals.total ? 'paid' : 'partial');
    const saved = DB.saveInvoice({ ...draft, number: invoiceNumber, status });

    if (isNew && numberConfig.autoGenerate) DB.bumpInvoiceNumber();
    setDraft(saved);
    refreshData();
    showToast(isNew ? 'Invoice generated' : 'Invoice updated');
    replace('invoicePreview', { invoiceId: saved.id });
  };

  const createShareURL = (invoice, client, business) => {
    const token = encodeSharePayload({ version: 1, invoice, client, business });
    return `${window.location.origin}${window.location.pathname}#share=${token}`;
  };

  const shareInvoice = async (invoice, client, business) => {
    const totals = computeTotals(invoice);
    const text = `Invoice ${invoice.number} for ${client.name}\nAmount: ${money(totals.total)}\nDue: ${formatDate(invoice.dueDate)}`;
    const url = createShareURL(invoice, client, business);

    if (navigator.share) {
      try {
        await navigator.share({ title: `Invoice ${invoice.number}`, text, url });
      } catch {
        // Closing the operating system share sheet is not an app error.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      showToast('Invoice details copied');
    } catch {
      showToast('Sharing is not supported in this browser');
    }
  };

  const copyInvoiceLink = async (invoice, client, business) => {
    try {
      await navigator.clipboard.writeText(createShareURL(invoice, client, business));
      showToast('Client share link copied');
    } catch {
      showToast('Could not copy the link');
    }
  };

  const renderHome = ({ replaceCurrent = false } = {}) => (
    <HomeScreen
      onNew={() => {
        setDraft(createInvoiceDraft());
        if (replaceCurrent) replace('createInvoice');
        else navigate('createInvoice');
      }}
      onOpen={(invoiceId) => navigate('invoicePreview', { invoiceId })}
      onSettings={() => navigate('settings')}
    />
  );

  const renderScreen = () => {
    switch (route.view) {
      case 'home':
        return renderHome();

      case 'createInvoice':
        if (!draft) return renderHome({ replaceCurrent: true });
        return (
          <CreateInvoiceScreen
            draft={draft}
            setDraft={setDraft}
            onBack={goBack}
            onConfig={() => navigate('numberConfig')}
            onSelectClient={() => setSheet({ type: 'client' })}
            onSelectItem={() => setSheet({ type: 'item' })}
            onEditLine={(index) => setSheet({ type: 'line', index })}
            onRemoveLine={(index) => setDraft((current) => ({
              ...current,
              lineItems: current.lineItems.filter((_, itemIndex) => itemIndex !== index),
            }))}
            onPayment={() => navigate('payment')}
            onGenerate={generateInvoice}
          />
        );

      case 'numberConfig':
        return (
          <NumberConfigScreen
            onBack={goBack}
            onSave={(config) => {
              const previous = DB.getConfig();
              const formatChanged = previous.prefix !== config.prefix
                || previous.sequenceLength !== config.sequenceLength
                || previous.startingNumber !== config.startingNumber
                || previous.separator !== config.separator;
              const savedConfig = {
                ...config,
                nextNumber: formatChanged
                  ? config.startingNumber
                  : (previous.nextNumber || config.startingNumber),
              };
              DB.saveConfig(savedConfig);
              if (draft && !draft.id) {
                setDraft((current) => ({
                  ...current,
                  number: savedConfig.autoGenerate
                    ? DB.nextInvoiceNumber()
                    : (previous.autoGenerate ? '' : current.number),
                }));
              }
              refreshData();
              showToast('Invoice number format saved');
              goBack();
            }}
          />
        );

      case 'clientForm':
        return (
          <ClientFormScreen
            clientId={route.params.clientId}
            onBack={goBack}
            onSave={(client) => {
              if (!client.name) {
                showToast('Please enter a client name');
                return;
              }
              const saved = DB.saveClient(client);
              if (draft) setDraft((current) => ({ ...current, clientId: saved.id }));
              refreshData();
              showToast('Client saved');
              goBack();
            }}
          />
        );

      case 'itemForm':
        if (!itemDraft) return null;
        return (
          <ItemFormScreen
            form={itemDraft}
            setForm={setItemDraft}
            onBack={() => {
              setItemDraft(null);
              goBack();
            }}
            onSelectCode={(kind) => setSheet({ type: 'code', kind })}
            onCreateCode={(kind) => navigate('codeForm', { kind })}
            onSave={(item) => {
              if (!item.name) {
                showToast('Please enter a name');
                return;
              }
              const saved = DB.saveItem(item);
              refreshData();
              addSavedItem(saved);
              setItemDraft(null);
              showToast(`${saved.type === 'service' ? 'Service' : 'Item'} saved and added`);
              goBack();
            }}
          />
        );

      case 'codeForm':
        return (
          <CodeFormScreen
            initialKind={route.params.kind}
            onBack={goBack}
            onSave={(kind, record) => {
              if (!record.code) {
                showToast('Please enter a code number');
                return;
              }
              const existingCodes = kind === 'sac' ? DB.getSAC() : DB.getHSN();
              if (existingCodes.some((entry) => String(entry.code).toLowerCase() === record.code.toLowerCase())) {
                showToast(`${kind.toUpperCase()} code already exists`);
                return;
              }
              if (kind === 'sac') DB.saveSAC(record);
              else DB.saveHSN(record);
              setItemDraft((current) => ({ ...current, [kind]: record.code, tax: record.tax }));
              refreshData();
              showToast(`${kind.toUpperCase()} saved`);
              goBack();
            }}
          />
        );

      case 'payment':
        return (
          <PaymentScreen
            draft={draft}
            onBack={goBack}
            onSave={(payment) => {
              if (!payment.date) {
                showToast('Please select a payment date');
                return;
              }
              setDraft((current) => ({ ...current, payment }));
              showToast('Payment details saved');
              goBack();
            }}
          />
        );

      case 'invoicePreview': {
        const invoice = DB.getInvoice(route.params.invoiceId);
        if (!invoice) {
          queueMicrotask(goHome);
          return null;
        }
        const client = DB.getClient(invoice.clientId) || { name: 'Unknown client' };
        const business = DB.getBusiness();
        return (
          <InvoicePreviewScreen
            invoice={invoice}
            client={client}
            business={business}
            onBack={goHome}
            onActions={() => setSheet({ type: 'actions', invoiceId: invoice.id })}
            onShare={() => shareInvoice(invoice, client, business)}
            onCopy={() => copyInvoiceLink(invoice, client, business)}
            onPrint={() => printInvoice(invoice, client, business, computeTotals(invoice))}
          />
        );
      }

      case 'sharedPreview': {
        const { invoice, client, business } = route.params.payload;
        return (
          <InvoicePreviewScreen
            invoice={invoice}
            client={client}
            business={business}
            shared
            onBack={goHome}
            onShare={() => shareInvoice(invoice, client, business)}
            onPrint={() => printInvoice(invoice, client, business, computeTotals(invoice))}
          />
        );
      }

      case 'settings':
        return (
          <SettingsScreen
            onBack={goBack}
            onSave={(business) => {
              DB.saveBusiness(business);
              refreshData();
              showToast('Business profile saved');
              goBack();
            }}
            onReset={() => {
              if (!window.confirm('This will permanently erase all clients, items, and invoices on this device and in your account. Continue?')) return;
              DB.resetAll();
              refreshData();
              showToast('All data was cleared');
              goHome();
            }}
            onSignOut={() => {
              Sync.signOut();
            }}
          />
        );

      default:
        return null;
    }
  };

  const getSheetContent = () => {
    if (!sheet) return null;

    if (sheet.type === 'client') {
      return {
        title: 'Select Client',
        subtitle: 'Choose a saved client or create a new one',
        body: (
          <ClientPickerSheet
            selectedId={draft?.clientId}
            onPick={(clientId) => {
              setDraft((current) => ({ ...current, clientId }));
              closeSheet();
            }}
            onCreate={() => {
              closeSheet();
              navigate('clientForm');
            }}
          />
        ),
      };
    }

    if (sheet.type === 'item') {
      return {
        title: 'Select Item / Service',
        subtitle: 'Choose a saved entry or create a new one',
        body: (
          <ItemPickerSheet
            onPick={(itemId) => {
              const item = DB.getItem(itemId);
              if (item) addSavedItem(item);
              closeSheet();
            }}
            onCreate={() => {
              setItemDraft(clone(blankItem));
              closeSheet();
              navigate('itemForm', { source: 'invoice' });
            }}
          />
        ),
      };
    }

    if (sheet.type === 'code') {
      return {
        title: `Select ${sheet.kind.toUpperCase()}`,
        subtitle: `Choose a saved ${sheet.kind.toUpperCase()} or create a new one`,
        body: (
          <CodePickerSheet
            kind={sheet.kind}
            onPick={(record) => {
              setItemDraft((current) => ({
                ...current,
                [sheet.kind]: record.code,
                tax: record.tax,
              }));
              closeSheet();
            }}
            onCreate={() => {
              const { kind } = sheet;
              closeSheet();
              navigate('codeForm', { kind });
            }}
          />
        ),
      };
    }

    if (sheet.type === 'line') {
      return {
        title: 'Edit Line Item',
        subtitle: draft?.lineItems[sheet.index]?.name,
        body: (
          <LineEditorSheet
            line={draft.lineItems[sheet.index]}
            onSave={(line) => {
              setDraft((current) => ({
                ...current,
                lineItems: current.lineItems.map((entry, index) => (
                  index === sheet.index ? line : entry
                )),
              }));
              closeSheet();
              showToast('Line item updated');
            }}
          />
        ),
      };
    }

    if (sheet.type === 'actions') {
      const invoice = DB.getInvoice(sheet.invoiceId);
      if (!invoice) return null;
      const client = DB.getClient(invoice.clientId) || { name: 'Client' };
      const business = DB.getBusiness();

      return {
        title: 'Invoice Actions',
        subtitle: `Invoice ${invoice.number}`,
        body: (
          <InvoiceActionsSheet
            invoice={invoice}
            onDuplicate={() => {
              const copy = clone(invoice);
              const config = DB.getConfig();
              delete copy.id;
              delete copy.createdAt;
              delete copy.updatedAt;
              if (config.autoGenerate) {
                copy.number = DB.nextInvoiceNumber();
              } else {
                const usedNumbers = new Set(DB.getInvoices().map((entry) => String(entry.number).toLowerCase()));
                const baseNumber = `${invoice.number}-COPY`;
                let candidate = baseNumber;
                let suffix = 2;
                while (usedNumbers.has(candidate.toLowerCase())) {
                  candidate = `${baseNumber}-${suffix}`;
                  suffix += 1;
                }
                copy.number = candidate;
              }
              copy.date = todayISO();
              copy.dueDate = addDays(copy.date, copy.dueIn || 7);
              copy.status = 'unpaid';
              copy.payment = null;
              const saved = DB.saveInvoice(copy);
              if (config.autoGenerate) DB.bumpInvoiceNumber();
              refreshData();
              closeSheet();
              showToast('Invoice duplicated');
              navigate('invoicePreview', { invoiceId: saved.id });
            }}
            onTogglePaid={() => {
              const updated = clone(invoice);
              if (updated.status === 'paid') {
                updated.status = 'unpaid';
                updated.payment = null;
              } else {
                const totals = computeTotals(updated);
                updated.status = 'paid';
                updated.payment = updated.payment || {
                  amount: totals.total,
                  date: todayISO(),
                  method: 'UPI',
                  reference: '',
                  notes: '',
                };
              }
              DB.saveInvoice(updated);
              refreshData();
              closeSheet();
              showToast(updated.status === 'paid' ? 'Marked as paid' : 'Marked as unpaid');
            }}
            onPrint={() => {
              closeSheet();
              printInvoice(invoice, client, business, computeTotals(invoice));
            }}
            onEdit={() => {
              setDraft(clone(invoice));
              closeSheet();
              navigate('createInvoice');
            }}
            onCancel={() => {
              const updated = clone(invoice);
              if (invoice.status === 'cancelled') {
                const totals = computeTotals(invoice);
                const paidAmount = Math.max(0, Number(updated.payment?.amount) || 0);
                updated.status = updated.statusBeforeCancel || (paidAmount <= 0
                  ? 'unpaid'
                  : (paidAmount >= totals.total ? 'paid' : 'partial'));
                delete updated.statusBeforeCancel;
              } else {
                updated.statusBeforeCancel = invoice.status;
                updated.status = 'cancelled';
              }
              DB.saveInvoice(updated);
              refreshData();
              closeSheet();
              showToast(updated.status === 'cancelled' ? 'Invoice cancelled' : 'Invoice reopened');
            }}
            onDelete={() => {
              if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
              DB.deleteInvoice(invoice.id);
              refreshData();
              closeSheet();
              showToast('Invoice deleted');
              goHome();
            }}
          />
        ),
      };
    }

    return null;
  };

  const sheetContent = getSheetContent();

  return (
    <div className="app">
      {renderScreen()}
      <BottomSheet
        open={Boolean(sheetContent)}
        title={sheetContent?.title}
        subtitle={sheetContent?.subtitle}
        onClose={closeSheet}
      >
        {sheetContent?.body}
      </BottomSheet>
      <Toast message={toastMessage} />
    </div>
  );
}
