const endpoint = process.argv[2] || 'http://127.0.0.1:9225';
const appUrl = process.argv[3] || process.env.POCKETBILL_URL || 'http://127.0.0.1:5173/';
const normalizedAppUrl = new URL(appUrl).href;

async function waitForPage() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const pages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
      const page = pages.find((entry) => entry.type === 'page' && entry.url.startsWith(normalizedAppUrl));
      if (page) return page;
    } catch {
      // Browser may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Pocketbill browser page was not available');
}

const page = await waitForPage();
const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const runtimeErrors = [];
let requestId = 0;

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') {
    runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    runtimeErrors.push(message.params.args.map((argument) => argument.value || argument.description).join(' '));
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

function command(method, params = {}) {
  requestId += 1;
  const id = requestId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

const pause = () => new Promise((resolve) => setTimeout(resolve, 120));
const clickButton = async (text) => {
  const clicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((entry) => entry.textContent.trim().includes(${JSON.stringify(text)}));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Button not found: ${text}`);
  await pause();
};

await command('Runtime.enable');
await command('Page.enable');
await command('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await evaluate(`localStorage.clear()`);
await command('Page.navigate', { url: normalizedAppUrl });
await new Promise((resolve) => setTimeout(resolve, 700));

const layout = await evaluate(`(() => {
  const app = document.querySelector('.app');
  const bodyStyle = getComputedStyle(document.body);
  const appStyle = getComputedStyle(app);
  return {
    innerWidth,
    devicePixelRatio,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyMargin: bodyStyle.margin,
    bodyPadding: bodyStyle.padding,
    appWidth: app.getBoundingClientRect().width,
    appLeft: app.getBoundingClientRect().left,
    appComputedWidth: appStyle.width,
  };
})()`);

await clickButton('+ New Invoice');
const createVisible = await evaluate(`document.body.innerText.includes('Create Invoice')`);
const dateRangeCorrect = await evaluate(`(() => {
  const date = document.querySelector('input[type="date"]')?.value;
  const dueDate = [...document.querySelectorAll('input[type="date"]')][1]?.value;
  if (!date || !dueDate) return false;
  const expected = new Date(date + 'T00:00:00Z');
  expected.setUTCDate(expected.getUTCDate() + 7);
  return dueDate === expected.toISOString().slice(0, 10);
})()`);
await clickButton('Add / Change Client');
const clientSheetVisible = await evaluate(`document.body.innerText.includes('Select Client') && document.querySelector('.sheet.show') !== null`);
const clientPicked = await evaluate(`(() => { const button = document.querySelector('.sheet.show .select-row'); if (!button) return false; button.click(); return true; })()`);
if (!clientPicked) throw new Error('No seeded client was available');
await pause();
await clickButton('+ Add Item');
const itemSheetVisible = await evaluate(`document.body.innerText.includes('Select Item / Service') && document.querySelector('.sheet.show') !== null`);
const itemPicked = await evaluate(`(() => { const button = document.querySelector('.sheet.show .select-row'); if (!button) return false; button.click(); return true; })()`);
if (!itemPicked) throw new Error('No seeded item was available');
await pause();
await clickButton('Generate Invoice');
const previewVisible = await evaluate(`document.body.innerText.includes('Invoice Preview') && document.body.innerText.includes('Total Invoice Amount')`);
const finalLayout = await evaluate(`({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })`);

await clickButton('More Actions');
const actionsVisible = await evaluate(`document.body.innerText.includes('Invoice Actions') && document.querySelector('.sheet.show') !== null`);
await clickButton('Mark as Paid');
const paidVisible = await evaluate(`document.body.innerText.includes('Payment Received')`);
await clickButton('More Actions');
await clickButton('Duplicate Invoice');
const duplicateCreated = await evaluate(`JSON.parse(localStorage.getItem('pb_invoices') || '[]').length === 2`);

await evaluate(`document.querySelector('button[aria-label="Go back"]')?.click()`);
await pause();
await evaluate(`document.querySelector('button[aria-label="Business settings"]')?.click()`);
await pause();
const settingsVisible = await evaluate(`document.body.innerText.includes('Business Profile')`);
await evaluate(`window.confirm = () => true`);
await clickButton('Erase all local data');
const resetStayedEmpty = await evaluate(`
  JSON.parse(localStorage.getItem('pb_clients') || '[]').length === 0
  && JSON.parse(localStorage.getItem('pb_items') || '[]').length === 0
  && JSON.parse(localStorage.getItem('pb_invoices') || '[]').length === 0
`);

await evaluate(`(() => {
  const config = {
    autoGenerate: false,
    prefix: 'PB',
    sequenceLength: 7,
    startingNumber: 1,
    separator: '-',
    nextNumber: 1,
  };
  localStorage.setItem('pb_invoice_config', JSON.stringify(config));
})()`);
await clickButton('+ New Invoice');
const manualNumberVisible = await evaluate(`document.querySelector('input[aria-label="Invoice number"]') !== null`);

const flow = {
  createVisible,
  dateRangeCorrect,
  clientSheetVisible,
  itemSheetVisible,
  previewVisible,
  actionsVisible,
  paidVisible,
  duplicateCreated,
  settingsVisible,
  resetStayedEmpty,
  manualNumberVisible,
};
if (layout.appWidth !== 390 || layout.appLeft !== 0 || layout.documentScrollWidth !== 390) {
  throw new Error(`Mobile layout overflow detected: ${JSON.stringify(layout)}`);
}
if (Object.values(flow).some((value) => value !== true)) {
  throw new Error(`End-to-end flow failed: ${JSON.stringify(flow)}`);
}
if (finalLayout.scrollWidth !== finalLayout.clientWidth) {
  throw new Error(`Invoice preview overflows horizontally: ${JSON.stringify(finalLayout)}`);
}
if (runtimeErrors.length) {
  throw new Error(`Browser runtime errors detected: ${JSON.stringify(runtimeErrors)}`);
}

console.log(JSON.stringify({
  layout,
  finalLayout,
  flow,
  runtimeErrors,
}, null, 2));

socket.close();
