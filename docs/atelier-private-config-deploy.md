# Déploiement — atelier CUSTOM (`shop_private_config`)

Ordre **sûr** (ne pas appliquer la migration avant le code en prod) :

1. **Sauvegarde** — Exporter la config atelier (`shop_banners` `position = atelier_custom`, JSON dans `link_url`) dans un fichier **hors git**.
2. **Push / déployer le code** — Git push → Vercel (ou équivalent). Tant que la table n’existe pas, le repli legacy lit encore `shop_banners` (**lecture seule**).
3. **Migration Supabase** — Appliquer `supabase/migrations/20261122181000_shop_private_config_atelier.sql` sur le projet DINGRY.
4. **Checklist RLS** — Exécuter `scripts/supabase-verify-rls.sql` (SQL Editor) ; valider les attentes en commentaires.
5. **Contrôle clé `anon`** (jamais `service_role`) :
   - `GET /rest/v1/shop_private_config` → **401/403** ou **`[]`** ;
   - `GET /rest/v1/shop_banners?select=position&position=eq.atelier_custom` → **`[]`**.
6. **App** — Tester `GET /api/atelier-custom` (vitrine) et `GET /api/admin/atelier-custom` (session admin CRM).

Ne pas committer l’export JSON ni de PII dans le dépôt.