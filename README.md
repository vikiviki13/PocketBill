# Pocketbill — React invoicing PWA

Pocketbill is a mobile-first invoicing web app built with React, semantic HTML, and native CSS. It works offline on the device and syncs to a Supabase backend when online. It can be installed as a PWA.

## Included workflows

- Create, edit, duplicate, cancel, delete, and mark invoices paid or unpaid.
- Configure automatic invoice numbering.
- Create and select clients.
- Create items and services with HSN/SAC codes, GST, stock, and units.
- Add discounts, additional charges, notes, and payment details.
- View a formatted invoice, share a portable client-preview link, and print/save as PDF.
- Sign up / sign in with email and password; data syncs to Supabase when online.
- Store all data in `localStorage` using the same `pb_*` keys as the original app.
- Install and reopen the app offline through its manifest and service worker.

## Technology

- React 19 with JSX
- Vite 8
- Native CSS using the original Pocketbill design tokens
- Supabase (Auth + PostgreSQL with row-level security) with a local-first sync layer
- Browser `localStorage`, Web Share, Clipboard, Print, and Service Worker APIs

No component library or CSS framework is used, so the UI remains lightweight and faithful to the supplied design system.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Vite uses port `5173` by default and automatically chooses the next available port if it is already occupied.

Without Supabase environment variables the app runs in local-only mode (no auth, no sync).

## Supabase setup

1. Create a free project at https://supabase.com/dashboard (or via `supabase projects create`).
2. Open **SQL Editor** in the dashboard, paste the contents of `supabase/schema.sql`, and run it. This creates the tables and row-level security policies.
3. Copy the **Project URL** and **anon public key** from **Project Settings → API**.
4. Create a `.env` file from `.env.example` and fill both values.
5. Sign up with any email address in the app to verify the auth + sync flow.

Auth uses email/password. If you keep email confirmations enabled (default), new accounts must confirm the link sent to their inbox before signing in.

## Data sync model

The app is local-first: it reads and writes `localStorage` synchronously, and the sync layer pushes changes to Supabase (debounced) whenever the device is online. Deletes are queued and applied in order. On sign-in, local changes are uploaded first, then the cloud state is pulled down. Share links (`#share=...`) are readable without an account.

## Production build

```bash
npm run build
npm run preview
```

The deployable output is written to `dist/`. Any static HTTPS host can serve that folder.

## Deploying to Vercel

With the Vercel CLI (or the dashboard import from GitHub):

```bash
vercel login
vercel link
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel --prod
```

The project ships with a `vercel.json` SPA rewrite so share links work on any path.

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
├── vercel.json
├── supabase/
│   └── schema.sql       # Tables + row-level security policies
├── src/
│   ├── App.jsx          # Navigation, shared state, persistence actions, and screen wiring
│   ├── components.jsx   # Shared interface components and icons
│   ├── db.js            # localStorage data layer and seed data
│   ├── keys.js          # Storage keys and table names shared with the sync layer
│   ├── sync.js          # Debounced push / pull sync engine for Supabase
│   ├── supabase.js      # Supabase client (from VITE_SUPABASE_* env vars)
│   ├── pdf.js           # Print/PDF invoice document
│   ├── utils.js         # Dates, totals, currency, and share-link encoding
│   ├── main.jsx         # React entry point, auth gate, and PWA registration
│   ├── styles.css       # Responsive and accessibility refinements
│   ├── screens/         # One editable React file for every full app screen
│   │   ├── AuthScreen.jsx
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

The app keeps a local copy of your data in the browser and syncs it to your Supabase account when online. A client share link contains a read-only encoded copy of the invoice, client, and business details so it can open on another device without a server. Anyone with that link can view the embedded invoice details.

Clearing browser site data removes local clients, items, and invoices. The Business Profile screen also includes an explicit erase action, which clears the cloud copies as well when connected. After using that erase action, demo records remain cleared after refresh rather than being seeded again.
