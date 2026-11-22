-- Config atelier CUSTOM : hors shop_banners (lecture publique anon).
-- Ordre : création → RLS → copie idempotente → suppression bannière legacy.

begin;

create table if not exists public.shop_private_config (
  key text primary key,
  payload text not null default '',
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.shop_private_config enable row level security;

revoke all on table public.shop_private_config from anon, authenticated;

grant all on table public.shop_private_config to service_role;

insert into public.shop_private_config (key, payload, is_active, updated_at)
select
  'atelier_custom',
  coalesce(nullif(trim(link_url), ''), ''),
  is_active,
  updated_at
from public.shop_banners
where position = 'atelier_custom'
on conflict (key) do nothing;

delete from public.shop_banners b
where b.position = 'atelier_custom'
  and exists (
    select 1
    from public.shop_private_config p
    where p.key = 'atelier_custom'
  );

commit;