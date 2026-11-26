-- Lot 1 multi-marques : collection parent (brand déjà présent depuis 20251109000001)
alter table public.products
  add column if not exists collection text not null default 'Signature';

alter table public.products
  alter column brand set default 'DINGRY';

comment on column public.products.collection is 'Collection catalogue parent (Signature, DINGRY MADA…)';