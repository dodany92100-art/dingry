-- CRM DINGRY — à coller dans Supabase SQL Editor (une fois).

create table if not exists public.products (
  id text primary key,
  sku text not null,
  name text not null,
  variant text not null default '',
  description text not null default '',
  fabrication text not null default '',
  limited_edition text not null default '',
  materials text not null default '',
  size_guide text not null default '',
  print_placement text not null default '',
  category text not null,
  price numeric(10,2) not null,
  sizes text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  publish_status text not null check (publish_status in ('draft', 'live')),
  color_declinations text[] not null default '{}',
  image_url text not null,
  blob_url text,
  blob_pathname text,
  image_back_url text not null default '',
  image_back_blob_url text,
  image_back_blob_pathname text,
  created_at timestamptz not null default now(),
  is_pinned boolean not null default false,
  display_order integer not null default 0
);

create unique index if not exists products_sku_idx on public.products (sku);

create table if not exists public.catalog_removed_ids (
  id text primary key
);

alter table public.products enable row level security;
alter table public.catalog_removed_ids enable row level security;

insert into storage.buckets (id, name, public)
values ('dgry-images', 'dgry-images', true)
on conflict (id) do update set public = true;

drop policy if exists "dgry-images public read" on storage.objects;
create policy "dgry-images public read"
on storage.objects for select
using (bucket_id in ('dgry-images', 'dgry images'));
