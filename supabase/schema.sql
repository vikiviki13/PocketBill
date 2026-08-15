-- PocketBill Supabase schema
-- Run this in the Supabase dashboard: SQL Editor -> New query -> Run

-- Row tables: one row per record, data stored as JSONB
create table if not exists public.pb_clients (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.pb_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.pb_hsn (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.pb_sac (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.pb_invoices (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Singleton tables: one row per user keyed by user_id
create table if not exists public.pb_business (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.pb_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: users can only see their own rows
alter table public.pb_clients enable row level security;
alter table public.pb_items enable row level security;
alter table public.pb_hsn enable row level security;
alter table public.pb_sac enable row level security;
alter table public.pb_invoices enable row level security;
alter table public.pb_business enable row level security;
alter table public.pb_config enable row level security;

create policy "own clients" on public.pb_clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own items" on public.pb_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own hsn" on public.pb_hsn
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sac" on public.pb_sac
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own invoices" on public.pb_invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own business" on public.pb_business
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own config" on public.pb_config
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);