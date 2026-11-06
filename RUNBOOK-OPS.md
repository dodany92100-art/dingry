# Runbook ops DINGRY — paiements & stock

Une page pour les incidents entre le lancement et le quotidien. **Pas de données client dans les alertes e-mail** : tout le détail est dans PayPal, le CRM admin ou Redis.

---

## 1. Paiement capturé sans commande CRM

**Symptômes :** alerte « Paiement sans brouillon », « montant refusé COMPLETED », « Commande PayPal introuvable » ; client a payé ; rien (ou incomplet) dans `/admin` commandes.

**Source de vérité Redis :** clés `dingry:paypal-orphan:{orderId}` (sans TTL). Valeur JSON : `{ reason, recordedAt }`.

**Étapes :**

1. Ouvrir PayPal (sandbox ou live) → commande `orderId` → vérifier capture, montant, adresse, `custom_id` (digest panier).
2. Upstash → chercher `dingry:paypal-draft:{orderId}` : si absent, le panier serveur est perdu (Redis expiré / preview partagée) → régularisation manuelle ou remboursement.
3. Si brouillon ou digest OK, **deux branches** (pas de commande demo) :
   - **Rembourser** via PayPal si vous ne pouvez pas honorer la vente (panier incertain, stock, délai).
   - **Honorer la vente** : régulariser la commande dans le CRM (données PayPal + lignes brouillon), ajuster le stock Redis si besoin, puis supprimer l’orphelin.
4. Après régularisation (commande CRM créée et cohérente) : supprimer l’orphelin Redis `DEL dingry:paypal-orphan:{orderId}` (automatique si `persistPayPalPayment` réussit).

**Prévention :** preview/prod Redis séparés ; webhook 200 + alerte une fois ; brouillon TTL 30 j.

---

## 2. Redis indisponible ou perdu

**Symptômes :** checkout 503, stock admin incohérent, `stockPending` sur commandes, cron stock-reconcile backlog.

**Étapes :**

1. Vérifier Upstash (quota, URL/token Vercel).
2. **Ne pas** seed prod depuis preview. `npm run seed-stock` uniquement sur l’env cible après contrôle catalogue Blob.
3. **Smoke B4 (post-seed)** — même Redis / même déploiement :
   ```bash
   npm run check:prod-env          # vars locales = export Vercel cible
   npm run seed-stock              # confirmer « oui » · clés dingry:stock:*
   SMOKE_BASE_URL=https://… npm run smoke:quote
   ```
   Échec **503** au quote ⇒ stock non initialisé ou Redis autre base que le site.
4. Cron : `POST /api/cron/stock-reconcile` avec `Authorization: Bearer {CRON_SECRET}` (≥ 32 car.).
5. Commandes `stockPending` : laisser le cron rejouer ; si rupture → statut **À vérifier** + motif `stock` dans admin.

---

## 3. Stock divergent (admin vs Redis)

**Symptômes :** vente refusée alors que admin affiche du stock ; ou inverse.

**Rappel :** le stock checkout est **Redis** (`dingry:stock:{productId}`), pas le champ Blob seul.

**Étapes :**

1. Admin → produit → ajuster stock (écrit Redis + Blob selon flux).
2. `npm run seed-stock` seulement si vous réinitialisez volontairement depuis le catalogue.
3. Commande **À vérifier** (`reviewReasons: stock`) — **ne pas** retirer le motif via `resolveReview` tant que `stockApplied` est faux (l’admin renverra 400). Procédure :
   - Corriger le stock Redis (admin → produit → delta, ou cron `POST /api/cron/stock-reconcile` si `stockPending`).
   - Attendre `stockApplied: true` (décrément réussi) ou régulariser manuellement (remboursement / honorer hors stock).
   - Ensuite seulement : PATCH `{ "resolveReview": "stock" }`, puis expédition.

---

## 4. Remboursement depuis le tableau de bord PayPal

**Symptômes :** alerte « Remboursement PayPal » (types **`PAYMENT.CAPTURE.REFUNDED`** ou **`PAYMENT.CAPTURE.REVERSED`** + capture + commande si connue).

**Étapes :**

1. Identifier la commande CRM par `orderId` / `captureId`.
2. Mettre à jour le statut admin (note interne) ; **ne pas** réincrémenter stock automatiquement — ajuster stock manuellement si la pièce revient en inventaire.
3. Pas de webhook « annulation CRM » automatique : traitement humain.

---

## 5. Adresse livraison absente

**Symptômes :** commande **À vérifier**, motif `adresse` ; alerte ops.

**Étapes :**

1. PayPal → adresse client ; compléter `shippingAddress` / `shippingName` via patch admin si vous ajoutez ce champ, ou contacter le client.
2. Le stock **a été décrémenté** à la capture (même sans adresse). Résoudre le motif : PATCH admin `{ "resolveReview": "adresse" }` (statut repasse **En attente** si plus aucun motif), puis flux normal.

---

## 6. Accès admin perdu (codes de secours épuisés + téléphone)

**Situation :** les 8 codes de secours sont consommés (`hashes` vides dans Blob) ; le téléphone avec Google Authenticator est perdu ou inaccessible. **Il ne reste plus de backup automatique** (pas de régénération au login).

**Procédure (à faire en local / accès Vercel, pas à improviser le jour J) :**

1. Générer un **nouveau** secret TOTP (Base32, ex. via `otpauth` / 1Password) — ne pas réutiliser l’ancien.
2. Vercel Production → **`ADMIN_TOTP_SECRET`** = nouveau secret → redéployer.
3. Vercel Blob (privé) → **supprimer** `dingry/admin/backup-codes.json` (ou vider le store pour repartir sur `missing`).
4. Upstash (optionnel) : parcourir les clés `dingry:totp:used:*` (SCAN) et les supprimer une par une avec `DEL` (Redis **`DEL` n’accepte pas de motif** — pas de wildcard en une commande).
5. **Réenrôlement :** en local (`npm run dev`, `NODE_ENV=development`), ouvrir `/admin`, scanner le **QR** (`GET /api/admin/totp` — **interdit en prod**). En prod sans QR : saisir le secret manuellement dans l’app Authenticator (même entrée que le QR).
6. Premier login TOTP réussi → les **8 nouveaux codes de secours** s’affichent **une fois** : les archiver hors ligne.
7. Vérifier **`ADMIN_SESSION_SECRET`** inchangé ou régénéré si compromission suspectée.

**Horloge TOTP :** fenêtre **±30 s** (`window: 1`). Si le téléphone est décalé de >30 s, les codes échouent et **comptent** dans le limiteur login — synchroniser l’heure (NTP) avant de paniquer.

---

## Store Blob `store.json` (passage public → private)

Avant le premier déploiement avec `access: "private"` sur `dingry/admin/store.json` :

1. Dashboard Vercel Blob → vérifier l’accès du fichier existant.
2. S’il est encore **public**, le lire (URL ou `get` public), sauvegarder une copie locale, puis le réécrire avec **`put(..., { access: "private" })`** (même pathname, pas de suffixe aléatoire).
3. Preview : une commande test doit rester visible dans `/admin` après redéploiement ; un `get` private qui renvoie `missing` alors que le blob existe en public provoquerait un **re-seed** et une perte d’historique.

---

## Contacts & variables critiques

- Alertes : `RESEND_API_KEY`, `OPS_ALERT_EMAIL`, `OPS_ALERT_FROM` — vérifier avec `npm run check:prod-env`.
- PayPal live : `PAYPAL_ENV`, webhook `PAYPAL_WEBHOOK_ID`, URL `/api/paypal/webhook`.
- Admin : `ADMIN_TOTP_SECRET`, `ADMIN_SESSION_SECRET` (≥ 32 car., prod). **Urgence session compromise :** changer `ADMIN_SESSION_SECRET` sur Vercel → tous les cookies admin deviennent invalides (pas de liste de sessions).
- **Rotation TOTP :** changer `ADMIN_TOTP_SECRET` invalide les **codes de secours** existants (hash lié au secret). Régénérer les codes manuellement après rotation (pas d’auto-régénération après épuisement).
- Turnstile : `TURNSTILE_EXPECTED_HOSTNAME` (domaines réels, ex. `dingry.com,www.dingry.com`). Preview : `VERCEL_URL` auto ou `TURNSTILE_PREVIEW_HOST_SUFFIX` (suffixe `.vercel.app` du projet).
- **Login admin bloqué (429 global) :** Upstash → `DEL dingry:admin-login:global` (et éventuellement `dingry:admin-login:ip:<adresse>`). Déclenché après 30 échecs globaux / 15 min (alerte ops).
- **Login admin 503 en local « prod » :** `NODE_ENV=production` + `next start` sans IP proxy réaliste → `clientAddress` = `unknown` → 503 (normal, pas une panne Vercel).

---

## Checklist preview avant bascule 6 nov.

**Avant la bascule prod :** envoyer **une alerte ops de test** (ex. déclencher une alerte connue en preview ou appeler le chemin d’alerte documenté) et confirmer réception sur `OPS_ALERT_EMAIL`.

**Rollback de bascule :** repasser `PAYPAL_ENV=sandbox`, webhook sandbox sur preview, variables PayPal live retirées ou isolées ; vérifier qu’aucun checkout live n’est possible ; Redis prod non mélangé avec preview.

Nominal checkout · Redis coupé · rejeu webhook (idempotence seulement) · montant modifié (doit échouer) · cron stock · adresse vide → À vérifier · test Lua Upstash test · **`npm run check:prod-env` avec les variables exportées depuis Vercel Production** (le script lit `.env` local — le dashboard prod reste la source de vérité) · **`npm run seed-stock` puis `SMOKE_BASE_URL=… npm run smoke:quote`** sur l’URL déployée.

### Test webhook sandbox — caractères non ASCII (**bloquant J-6**)

Objectif : prouver que **`verify-webhook-signature`** reçoit le **corps brut** PayPal (pas une re-sérialisation JSON) quand le payload contient des caractères non ASCII.

**Isoler le chemin webhook (méthode recommandée).** Fermer l’onglet après approbation est **fragile** : le client peut encore appeler `/api/checkout` avant la fermeture. Pour être sûr que **c’est le webhook** qui crée la commande :

1. Passer un checkout sandbox jusqu’à **capture** (PayPal enregistre l’événement `PAYMENT.CAPTURE.COMPLETED`).
2. S’assurer qu’**aucune commande CRM** n’existe pour cet `orderId` (ne pas laisser le retour boutique finir le flux, **ou** supprimer la commande de test du CRM avant le test).
3. Upstash → vérifier que **`dingry:paypal-draft:{orderId}`** existe encore. Sans brouillon, le webhook part en **« brouillon absent »** (orphelin / alerte) : ce n’est **pas** la preuve `raw`.
4. PayPal Developer → Webhooks → **Resend** sur l’événement `PAYMENT.CAPTURE.COMPLETED` concerné.
5. Logs Vercel **`[paypal-webhook]`** : un **401** n’est émis qu’**avant** toute lecture du brouillon. **Preuve suffisante :** pas de 401 **+** commande CRM **créée par le webhook** avec les caractères attendus.

**Où mettre les accents.** L’événement de capture contient surtout les données **payeur / expédition** PayPal, pas les libellés d’articles personnalisés du panier. Pour tester `raw` avec non-ASCII, mettre l’accent dans le **nom du payeur** ou le **nom sur l’adresse de livraison** du compte acheteur sandbox (modifier le profil sandbox si besoin). En CRM, comparer surtout **`customerName`** (`payerName`) et **`shippingName`** si présent.

**Jeux de caractères minimum** (un run ou plusieurs captures / Resend) :

| Caractère | Exemple |
|-----------|---------|
| é | Éléonore |
| ç | François |
| apostrophe typographique | O’Brien (U+2019 `’`) |
| emoji | prénom sandbox court 🎉 |

**Ne pas confondre statut HTTP et preuve.** Un **200** sur un **Resend** alors que la commande existait déjà ne prouve que l’**idempotence**. Pour la preuve `raw`, viser un Resend (ou premier envoi PayPal) où la commande **n’existait pas** encore, brouillon présent, **pas de 401**.

**Compte-rendu** — **une ligne par variante** avec :

`premier passage | Resend` · statut HTTP · **401 oui/non** dans les logs · nom tel que persisté (`customerName` / `shippingName`) · variante (é, ç, ’, emoji) · **champ source** (payeur / expédition).

**401 sur un événement légitime** — vérifier dans l’ordre :

1. `PAYPAL_WEBHOOK_ID` = webhook **sandbox** sur preview (pas live).
2. OAuth / certificats : credentials **sandbox** + URL API sandbox (`PAYPAL_ENV=sandbox`).
3. Corps **brut** de la requête (byte-for-byte) passé à la vérification — toute re-parse JSON côté route avant verify casse les accents.

Ensuite seulement : autres scénarios checklist (Redis coupé pendant capture, rejeu idempotence, etc.).
