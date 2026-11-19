-- CRM catalogue : aucun accès PostgREST direct (anon / authenticated).
-- L’app Next utilise SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
-- lookbook_slides + shop_banners : policies lecture publique inchangées (migration 20251110210000).

REVOKE ALL ON TABLE public.products FROM anon, authenticated;
REVOKE ALL ON TABLE public.product_options FROM anon, authenticated;
REVOKE ALL ON TABLE public.catalog_removed_ids FROM anon, authenticated;

GRANT SELECT ON TABLE public.lookbook_slides TO anon, authenticated;
GRANT SELECT ON TABLE public.shop_banners TO anon, authenticated;

-- Storage legacy (dgry-images) : lecture publique uniquement, pas d’upload anon.
DROP POLICY IF EXISTS "dgry-images anon insert" ON storage.objects;
DROP POLICY IF EXISTS "dgry-images authenticated insert" ON storage.objects;