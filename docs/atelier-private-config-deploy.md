# Déploiement — atelier CUSTOM (`shop_private_config`)

Ordre recommandé (sans commit de PII) :

1. **Sauvegarde** — Exporter la config atelier (admin CRM ou ligne `shop_banners` `position = atelier_custom`) dans un fichier **hors git**.
2. **Code** — Déployer l’app (repli legacy en **lecture** si la table n’existe pas encore).
3. **Migration** — Appliquer `supabase/migrations/20261122181000_shop_private_config_atelier.sql` sur le projet Supabase DINGRY.
4. **RLS** — Exécuter `scripts/supabase-verify-rls.sql` (SQL Editor) et vérifier les résultats attendus en commentaires.
5. **Clé anon (manuel)** — Avec `NEXT_PUBLIC_SUPABASE_URL` + clé anon (jamais la `service_role`) :
   - `GET /rest/v1/shop_private_config` → **401/403** ou corps vide / aucune ligne utile ;
   - `GET /rest/v1/shop_banners?select=position&position=eq.atelier_custom` → **`[]`**.
6. **App** — Tester `GET /api/atelier-custom` (vitrine) et `GET /api/admin/atelier-custom` (session admin).