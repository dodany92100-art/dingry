-- DINGRY : variant_sku, SEO alt_text, marque, chemins R2

alter table public.products
  add column if not exists brand text not null default 'DINGRY',
  add column if not exists seo_slug text not null default '';

comment on column public.products.brand is 'Marque catalogue (DINGRY)';
comment on column public.products.seo_slug is 'Slug canonical parent (ex: hoodie-essential) — une URL par fiche';

alter table public.product_options
  add column if not exists brand text not null default 'DINGRY',
  add column if not exists color text not null default '',
  add column if not exists variant_sku text not null default '',
  add column if not exists alt_text text not null default '';

comment on column public.product_options.variant_sku is 'SKU déclinaison ex: DINGRY-HOODIE-ESS-RED';
comment on column public.product_options.color is 'Couleur / option (RED, NOIR…)';
comment on column public.product_options.alt_text is 'Texte alternatif image (SEO accessibilité)';

create unique index if not exists product_options_variant_sku_uidx
  on public.product_options (variant_sku)
  where length(trim(variant_sku)) > 0;
