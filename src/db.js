import { KEYS, ROW_TABLES } from './keys.js';
import { Sync } from './sync.js';

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error('Pocketbill storage read failed', key, error);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Pocketbill storage write failed', key, error);
    return false;
  }
}

function readList(key) {
  const value = read(key, []);
  return Array.isArray(value) ? value : [];
}

function readObject(key, fallback) {
  const value = read(key, fallback);
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...fallback, ...value }
    : { ...fallback };
}

const defaultBusiness = {
  name: 'Your Business',
  email: '',
  phone: '+91 89798 89798',
  address: 'Ved Vihar, Chandani Chowk, Kothrud',
  city: 'Pune',
  pin: '411038',
  state: 'Maharashtra',
  country: 'India',
  logoInitial: 'PB',
};

const defaultConfig = {
  autoGenerate: true,
  prefix: 'PB',
  sequenceLength: 7,
  startingNumber: 1,
  separator: '-',
  nextNumber: 1,
};

export const DB = {
  uid,

  getBusiness: () => readObject(KEYS.business, defaultBusiness),
  saveBusiness(business) {
    write(KEYS.business, business);
    Sync.queuePush('business');
    return business;
  },

  getConfig: () => readObject(KEYS.config, defaultConfig),
  saveConfig(config) {
    write(KEYS.config, config);
    Sync.queuePush('config');
    return config;
  },
  previewNumber(config = this.getConfig()) {
    const number = String(config.startingNumber || 1).padStart(config.sequenceLength || 7, '0');
    return config.separator
      ? `${config.prefix}${config.separator}${number}`
      : `${config.prefix}${number}`;
  },
  nextInvoiceNumber() {
    const config = this.getConfig();
    const number = String(config.nextNumber || config.startingNumber || 1).padStart(config.sequenceLength || 7, '0');
    return config.separator
      ? `${config.prefix}${config.separator}${number}`
      : `${config.prefix}${number}`;
  },
  bumpInvoiceNumber() {
    const config = this.getConfig();
    config.nextNumber = (config.nextNumber || config.startingNumber || 1) + 1;
    this.saveConfig(config);
  },

  getClients: () => readList(KEYS.clients),
  getClient(id) {
    return this.getClients().find((client) => client.id === id);
  },
  saveClient(client) {
    const clients = this.getClients();
    const saved = { ...client, id: client.id || uid('cli') };
    const index = clients.findIndex((entry) => entry.id === saved.id);
    if (index >= 0) clients[index] = saved;
    else clients.push(saved);
    write(KEYS.clients, clients);
    Sync.queuePush('clients');
    return saved;
  },
  deleteClient(id) {
    write(KEYS.clients, this.getClients().filter((client) => client.id !== id));
    Sync.queueDelete('clients', id);
  },

  getHSN: () => readList(KEYS.hsn),
  saveHSN(record) {
    const list = this.getHSN();
    const saved = { ...record, id: record.id || uid('hsn') };
    const index = list.findIndex((entry) => entry.id === saved.id);
    if (index >= 0) list[index] = saved;
    else list.push(saved);
    write(KEYS.hsn, list);
    Sync.queuePush('hsn');
    return saved;
  },
  getSAC: () => readList(KEYS.sac),
  saveSAC(record) {
    const list = this.getSAC();
    const saved = { ...record, id: record.id || uid('sac') };
    const index = list.findIndex((entry) => entry.id === saved.id);
    if (index >= 0) list[index] = saved;
    else list.push(saved);
    write(KEYS.sac, list);
    Sync.queuePush('sac');
    return saved;
  },

  getItems: () => readList(KEYS.items),
  getItem(id) {
    return this.getItems().find((item) => item.id === id);
  },
  saveItem(item) {
    const items = this.getItems();
    const saved = { ...item, id: item.id || uid('itm') };
    const index = items.findIndex((entry) => entry.id === saved.id);
    if (index >= 0) items[index] = saved;
    else items.push(saved);
    write(KEYS.items, items);
    Sync.queuePush('items');
    return saved;
  },
  deleteItem(id) {
    write(KEYS.items, this.getItems().filter((item) => item.id !== id));
    Sync.queueDelete('items', id);
  },

  getInvoices: () => readList(KEYS.invoices).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
  getInvoice(id) {
    return readList(KEYS.invoices).find((invoice) => invoice.id === id);
  },
  saveInvoice(invoice) {
    const invoices = readList(KEYS.invoices);
    const saved = {
      ...invoice,
      id: invoice.id || uid('inv'),
      createdAt: invoice.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    const index = invoices.findIndex((entry) => entry.id === saved.id);
    if (index >= 0) invoices[index] = saved;
    else invoices.push(saved);
    write(KEYS.invoices, invoices);
    Sync.queuePush('invoices');
    return saved;
  },
  deleteInvoice(id) {
    write(KEYS.invoices, readList(KEYS.invoices).filter((invoice) => invoice.id !== id));
    Sync.queueDelete('invoices', id);
  },

  seedIfNeeded() {
    if (read(KEYS.seeded, false)) return;

    this.saveClient({
      name: 'Passionbits',
      email: 'gorade.kashmira@gmail.com',
      phone: '+91 89798 89798',
      address: 'Ved Vihar, Chandani Chowk, Kothrud',
      city: 'Pune',
      pin: '411038',
      state: 'Maharashtra',
      country: 'India',
    });
    this.saveClient({
      name: 'Passionbits Studio',
      email: '',
      phone: '+91 89798 89798',
      address: 'Ved Vihar, Chandani Chowk, Kothrud',
      city: 'Pune',
      pin: '411038',
      state: 'Maharashtra',
      country: 'India',
    });
    this.saveClient({
      name: 'Passionbits Labs',
      email: '',
      phone: '+91 89798 89798',
      address: 'Ved Vihar, Chandani Chowk, Kothrud',
      city: 'Pune',
      pin: '411038',
      state: 'Maharashtra',
      country: 'India',
    });

    this.saveHSN({ code: '8471', tax: 18, description: 'Computers, laptops and related data processing machines' });
    this.saveHSN({ code: '8517', tax: 18, description: 'Mobile phones, telephone and communication devices' });
    this.saveHSN({ code: '9403', tax: 18, description: 'Office furniture, including desks and chairs' });
    this.saveSAC({ code: '998311', tax: 18, description: 'Management consulting services' });
    this.saveSAC({ code: '998314', tax: 18, description: 'Information technology design and development services' });
    this.saveSAC({ code: '998315', tax: 18, description: 'Hosting and information-technology infrastructure services' });

    this.saveItem({
      type: 'item',
      name: 'Tooth Brush',
      price: 100,
      hsn: '8471',
      sac: '',
      tax: 5,
      unit: 'Pieces',
      stock: 0,
      description: '',
    });
    this.saveItem({
      type: 'item',
      name: 'Tooth Paste',
      price: 200,
      hsn: '8471',
      sac: '',
      tax: 5,
      unit: 'Pieces',
      stock: 0,
      description: '',
    });

    write(KEYS.seeded, true);
  },

  resetAll() {
    // Snapshot the remote ids before clearing local storage so the cloud
    // copies can be removed too.
    const collections = {
      clients: this.getClients(),
      items: this.getItems(),
      hsn: this.getHSN(),
      sac: this.getSAC(),
      invoices: this.getInvoices(),
    };
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    // Keep the first-run marker so an explicit erase stays empty after refresh.
    write(KEYS.seeded, true);
    ROW_TABLES.forEach((table) => {
      collections[table].forEach((row) => Sync.queueDelete(table, row.id));
    });
    Sync.queueDelete('business', '');
    Sync.queueDelete('config', '');
  },
};

Sync.init();
