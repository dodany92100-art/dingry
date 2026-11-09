-- Produits parent + options (couleur / finition) — made-to-order DINGRY
-- Exécuter dans Supabase SQL Editor (ou via CLI migrate).

alter table public.products
  add column if not exists fulfillment_mode text not null default 'made_to_order'
    check (fulfillment_mode in ('made_to_order', 'stocked'));

comment on column public.products.fulfillment_mode is
  'made_to_order : stock = capacité fabrication (pas de pièces en réserve physique)';

comment on column public.products.stock is
  'Capacité commandes simultanées (MTO) ou stock physique si fulfillment_mode = stocked';

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  option_key text not null,
  label text not null,
  sku_suffix text not null,
  price_delta numeric(10, 2) not null default 0,
  image_url text not null default '',
  image_blob_pathname text,
  sort_order integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_options_product_option_key unique (product_id, option_key)
);

create index if not exists product_options_product_id_idx on public.product_options (product_id);

comment on table public.product_options is
  'Déclinaisons du produit parent (couleur…) : SKU combiné, visuels optionnels (R2)';

alter table public.product_options enable row level security;
