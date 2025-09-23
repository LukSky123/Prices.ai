-- Schema for Prices.ai
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null
);

create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null
);

create table if not exists public.prices (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  price numeric not null,
  date_scraped timestamp with time zone not null default now()
);

-- Indexes
create index if not exists idx_prices_item on public.prices(item_id);
create index if not exists idx_prices_market on public.prices(market_id);
create index if not exists idx_prices_date on public.prices(date_scraped);

-- Enable RLS and allow public read-only
alter table public.items enable row level security;
alter table public.markets enable row level security;
alter table public.prices enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'items' and policyname = 'Public read items') then
    create policy "Public read items" on public.items for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'markets' and policyname = 'Public read markets') then
    create policy "Public read markets" on public.markets for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'prices' and policyname = 'Public read prices') then
    create policy "Public read prices" on public.prices for select to anon using (true);
  end if;
end $$;

-- Cleaned products table for AI-normalized rows
create table if not exists public.clean_products (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  brand text not null,
  size text not null,
  notes text not null,
  price numeric not null,
  discount numeric,
  product_url text not null,
  source text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.clean_products enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'clean_products' and policyname = 'Public read clean products') then
    create policy "Public read clean products" on public.clean_products for select to anon using (true);
  end if;
end $$;



