# Déploiement DINGRY (Supabase + R2 + Node)

Guide de vérification **avant** `npm run build` et redémarrage du serveur.

## 1. Variables obligatoires

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | API Supabase — **produits**, **`lookbook_slides`**, **`shop_banners`** |
| `SUPABASE_SERVICE_ROLE_KEY` | Écriture serveur (jamais côté client) — obligatoire pour admin catalogue, lookbook, bannière |
| `DINGRY_CRM_SOURCE=1` | Vitrine catalogue = live Supabase uniquement (recommandé prod) |
| `R2_ACCOUNT_ID` | Compte Cloudflare |
| `R2_BUCKET_NAME` | Bucket R2 (défaut `dingrybuckets`) |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Clés S3 API R2 (32 + 64 car.) — uploads admin produits / lookbook / bannière — aide : [`docs/images/r2-upload-errors-guide.jpg`](images/r2-upload-errors-guide.jpg) |
| `R2_PUBLIC_BASE_URL` | `https://pub-5c13c59abc20442390a5eee5cb7034b0.r2.dev` |
| `DINGRY_IMG_HOSTS` | Hostname R2 autorisé (CSP + images) |
| `DINGRY_IMG_HOSTS` | Hostname R2 sans `https://` (CSP au build) |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | Stock + login admin |
| `ADMIN_SESSION_SECRET` (≥ 32) | Cookie admin |
| `ADMIN_TOTP_SECRET` | 2FA admin |

Optionnel mais recommandé :

- `ADMIN_STORE_SNAPSHOT_PATH` — snapshot JSON commandes (legacy ; lookbook + bannières = Supabase)
- `TURNSTILE_EXPECTED_HOSTNAME=dingry.com,www.dingry.com`

## 2. Contrôles automatisés

```bash
npm run check:prod-env
```

Tous les items doivent être ✓ (y compris **R2 upload CRM** et **Supabase**).

## 3. Build

```bash
npm ci
npm run build
```

Le build exécute `validateProductionEnv()` : paire Supabase **requise**.

## 4. Migration images (une fois)

Après configuration R2, depuis une machine avec accès Supabase :

```bash
# Simulation
npm run migrate:r2-images -- --dry-run

# Lot limité
npm run migrate:r2-images -- --limit=10

# Tout le catalogue (hors Cloudinary par défaut)
npm run migrate:r2-images
```

Les hoodies Cloudinary canoniques restent inchangés sauf `--include-cloudinary`.

## 5. Redémarrage

```bash
npm run start
# ou process manager (pm2, systemd) avec NODE_ENV=production
```

Assure-toi que le répertoire `data/admin/` (ou `ADMIN_STORE_SNAPSHOT_PATH`) est **writable** et persistant.

## 6. Validation manuelle

1. **Admin** `/admin` → connexion TOTP.
2. **Network** `GET /api/admin/products` → `"r2ImageStorage": true`.
3. Modifier un produit → upload image → URL `https://pub-….r2.dev/dingry/products/…`.
4. **Boutique** `/websitedx` ou `/api/catalog` → images chargées (pas de 403 CSP).
5. Stock admin → autosave après 6 s (indicateur sur la carte).

## 7. Dépannage rapide

| Symptôme | Piste |
|----------|--------|
| Vignettes admin cassées | `image_url` en base ≠ R2 → `npm run migrate:r2-images` ou ré-upload |
| 503 catalogue | Supabase URL + service role manquants |
| Upload 503 | Variables R2 incomplètes ou bucket non public |
| Commandes / lookbook perdus au reboot | Snapshot non persistant → `ADMIN_STORE_SNAPSHOT_PATH` sur disque |
