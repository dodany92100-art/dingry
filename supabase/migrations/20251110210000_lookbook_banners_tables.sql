-- Lookbook + bannières boutique (source CRM Supabase, images R2 via image_url).

create table if not exists public.lookbook_slides (
  id text primary key,
  title text not null default '',
  subtitle text not null default '',
  image_url text not null,
  link_url text not null default '',
  image_blob_pathname text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lookbook_slides_display_order_idx on public.lookbook_slides (display_order);

create table if not exists public.shop_banners (
  id text primary key,
  title text not null default '',
  subtitle text not null default '',
  eyebrow text not null default '',
  cta_label text not null default '',
  image_url text not null,
  link_url text not null default '',
  image_blob_pathname text,
  position text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists shop_banners_position_idx on public.shop_banners (position);

alter table public.lookbook_slides enable row level security;
alter table public.shop_banners enable row level security;

drop policy if exists "lookbook_slides_public_read" on public.lookbook_slides;
create policy "lookbook_slides_public_read"
on public.lookbook_slides for select
to anon, authenticated
using (is_active = true);

drop policy if exists "shop_banners_public_read" on public.shop_banners;
create policy "shop_banners_public_read"
on public.shop_banners for select
to anon, authenticated
using (is_active = true);

-- Écritures : routes admin Next.js (SUPABASE_SERVICE_ROLE_KEY).
