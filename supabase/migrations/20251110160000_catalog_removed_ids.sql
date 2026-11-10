-- Tombstones vitrine (ids masqués sans fiche CRM).
create table if not exists public.catalog_removed_ids (
  id text primary key
);

alter table public.catalog_removed_ids enable row level security;
