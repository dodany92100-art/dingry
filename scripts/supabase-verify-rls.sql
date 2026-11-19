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