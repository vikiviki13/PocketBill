# Pocketbill — React invoicing PWA

Pocketbill is a mobile-first invoicing web app built with React, semantic HTML, and native CSS. It runs entirely in the browser, stores data on the device, can be installed as a PWA, and does not require a backend or account.

## Included workflows

- Create, edit, duplicate, cancel, delete, and mark invoices paid or unpaid.
- Configure automatic invoice numbering.
- Create and select clients.
- Create items and services with HSN/SAC codes, GST, stock, and units.
- Add discounts, additional charges, notes, and payment details.
- View a formatted invoice, share a portable client-preview link, and print/save as PDF.
- Store all data in `localStorage` using the same `pb_*` keys as the original app.
- Install and reopen the app offline through its manifest and service worker.

## Technology

- React 19 with JSX
- Vite 8
- Native CSS using the original Pocketbill design tokens
- Browser `localStorage`, Web Share, Clipboard, Print, and Service Worker APIs

No component library or CSS framework is used, so the UI remains lightweight and faithful to the supplied design system.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Vite uses port `5173` by default and automatically chooses the next available port if it is already occupied.

## Production build

```bash
npm run build
npm run preview
```

The deployable output is written to `dist/`. Any static HTTPS host can serve that folder.

## Quality checks

```bash
npm run check
```

This runs ESLint, the date/storage/calculation unit tests, the production build, and PWA output validation. The optional mobile browser workflow is available in `scripts/cdp-check.mjs` for a headless Edge session with remote debugging enabled.

## Project structure

```text
invoice-app/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── App.jsx          # Navigation, shared state, persistence actions, and screen wiring
│   ├── components.jsx   # Shared interface components and icons
│   ├── db.js            # localStorage data layer and seed data
│   ├── pdf.js           # Print/PDF invoice document
│   ├── utils.js         # Dates, totals, currency, and share-link encoding
│   ├── main.jsx         # React entry point and PWA registration
│   ├── styles.css       # Responsive and accessibility refinements
│   ├── screens/         # One editable React file for every full app screen
│   │   ├── HomeScreen.jsx
│   │   ├── CreateInvoiceScreen.jsx
│   │   ├── NumberConfigScreen.jsx
│   │   ├── ClientFormScreen.jsx
│   │   ├── ItemFormScreen.jsx
│   │   ├── CodeFormScreen.jsx
│   │   ├── PaymentScreen.jsx
│   │   ├── InvoicePreviewScreen.jsx
│   │   └── SettingsScreen.jsx
│   └── sheets/          # Separate client/item/code pickers and action editors
├── css/style.css        # Original Pocketbill design tokens and base styles
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── service-worker.js
└── scripts/cdp-check.mjs # Automated mobile end-to-end browser check
```

## Data and sharing

Business data is stored only in the browser. A client share link contains a read-only encoded copy of the invoice, client, and business details so it can open on another device without a server. Anyone with that link can view the embedded invoice details.

Clearing browser site data removes local clients, items, and invoices. The Business Profile screen also includes an explicit erase action.
After using that erase action, demo records remain cleared after refresh rather than being seeded again.
