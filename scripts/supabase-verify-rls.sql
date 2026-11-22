-- Checklist manuelle (Supabase SQL Editor) après déploiement des migrations CRM.
-- Aucun résultat = absence de policy permissive sur les tables catalogue.

select schemaname, tablename, policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('products', 'product_options', 'catalog_removed_ids')
order by tablename, policyname;

-- Attendu : 0 ligne sur products / product_options / catalog_removed_ids.

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('products', 'product_options', 'catalog_removed_ids')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee;

-- Attendu : pas de GRANT sur ces trois tables pour anon/authenticated.

-- shop_private_config : RLS activée
select c.relname, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'shop_private_config';

-- Attendu : relrowsecurity = true.

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'shop_private_config'
  and grantee in ('anon', 'authenticated')
order by grantee;

-- Attendu : 0 ligne.

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'shop_private_config';

-- Attendu : 0 policy (accès via service_role / API serveur uniquement).

select count(*) as atelier_rows_in_shop_banners
from public.shop_banners
where position = 'atelier_custom';

-- Attendu : 0 après migration 20261122181000.

select key, is_active, length(payload) as payload_len, updated_at
from public.shop_private_config
where key = 'atelier_custom';

-- Attendu : 1 ligne (payload_len > 0 si config déjà sauvegardée en prod).