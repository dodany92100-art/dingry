# Archive des règles Cursor (historique)

> Fichiers fusionnés dans `.cursor/rules/dingry.mdc` — conservation à titre documentaire uniquement (non chargés par l’agent).

---

## Source : `.cursorrules` (protégés)

```markdown
# DINGRY — fichiers protégés (agent Cursor)

Sauf **demande explicite** de l'utilisateur, ne pas modifier les zones ci-dessous. Lecture et diagnostic autorisés. Aucun refactor ni correctif « opportuniste » sur ces chemins.

## Authentification Supabase (boutique)

- `components/auth/auth-modal.tsx`
- Tout le dossier `lib/supabase/**` (dont `oauth-flags.ts`, client navigateur)

## Connexion Google (OAuth Supabase + callback)

- `app/auth/callback/**`
- `lib/auth/auth-callback-oauth.ts`, `lib/auth/auth-callback-origin.ts`, `lib/auth/auth-callback-next.ts`
- `lib/auth/scrub-public-oauth-query.ts`, `lib/auth/map-auth-error.ts`
- `scripts/enable-supabase-google-oauth.mjs`
- `hooks/use-shop-auth.ts`

## Compte client, invité, rattachement commandes

- Tout le dossier `lib/shop/**`
- `app/api/shop/orders/**`
- `app/api/shop/fulfillment/**`

## Tunnel PayPal (paiement → enregistrement commande)

- `lib/paypal-server.ts`, `lib/paypal-persist.ts`, `lib/paypal-draft.ts`, `lib/paypal-return-origin.ts`
- `app/api/checkout/route.ts`
- `app/checkout/**`
- `app/api/paypal/**`
- `hooks/use-shop-orders.ts`, `hooks/use-fulfillment-orders.ts`

## Déblocage

Modifier ces fichiers **uniquement** si la requête utilisateur le nomme clairement (ex. « modifie auth-modal », « Google OAuth », « corrige capture PayPal »), avec un diff minimal.
```

---

## Source : `.cursor/rules/dingry-only.mdc`

```markdown
---
description: Projet DINGRY uniquement — pas RAP2K
alwaysApply: true
---

# DINGRY (rts-sepia) — périmètre strict

Ce workspace est **la boutique DINGRY** (streetwear). **Ne pas** appliquer les conventions RAP2K (Vite, `useTonkeys`, `src/app`, Ligue Arena, Méthode Diabira Fibonacci, alias `@/` Rap2K).

## Stack

- Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- Paiement : `app/api/checkout/route.ts` + PayPal (`NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`)
- UI boutique : `components/templates/dingry-shop-page.tsx` (page Next : `components/pages/`) ; teasing : `DINGRY_PUBLIC_HOME=teaser` + `components/templates/dingry-teaser-home.tsx`
- Composants : Atomic Design sous `components/{atoms,molecules,organisms,templates,pages}/`
- Layout / styles : `app/layout.tsx`, `app/globals.css`
- Contenus client : `public/DINGRY-contenus-client.html`

## Règles de travail

- Modifications **minimales** ; pas de refactor massif sans demande explicite
- Images produits : URLs Cloudinary déjà dans `page.tsx` ; pas d’invention d’URLs
- TypeScript strict ; pas de `any`
- Explications en **français** sauf demande contraire
- Ne pas toucher aux dossiers hors ce workspace (`agence tout site/ RAP2K`, `~/` repo rap2k)

## Dev local

- Boutique : http://localhost:3000/
- Checkout : http://localhost:3000/checkout
- Admin : http://localhost:3000/admin
- Lancer : `npm run dev` (port **3000** par défaut)

## Token economy (agent) — obligatoire

- **Ultra-concision** : pas de salutations, filler, ni longues explications sauf demande explicite
- **Diffs ciblés uniquement** : ne pas réécrire des fichiers entiers ; lignes/composants modifiés seulement
- **Recherche limitée** : avant un grep/search, restreindre au dossier ou fichier concerné — pas de scan workspace entier sans nécessité
- Réponses en **français** (sauf demande contraire)

## Git

- Dépôt Git **local à ce dossier** uniquement. Ne pas confondre avec le dépôt `rap2k` à la racine du home utilisateur.
```

---

## Source : `.cursor/rules/dingry-ux-freeze.mdc`

```markdown
---
description: Gel UX DINGRY — aucune modification sans accord explicite de l'utilisateur
alwaysApply: true
---

# DINGRY — gel UX (priorité absolue)

## Principe

**Aucun changement de code, styles, contenus ni comportement boutique** sans que l'utilisateur l'ait **nommé explicitement** dans le message courant (fichier, zone UI, ou action précise).

## Interdit sans accord explicite

- Ajouter ou supprimer un élément UI (bouton, lien, section, texte, effet, animation, zone cliquable).
- Modifier layout, ordre nav, couleurs, typo, espacements, interactions « pour améliorer » ou par cohérence.
- Refactor, renommage, déplacement de composants, « bonus » ou correctifs opportunistes.
- Revert non demandé des changements de la session.
- `git commit`, `git push`, déploiement.

## Autorisé sans demander à chaque ligne

- Lire / diagnostiquer / expliquer (y compris cause d'une erreur).
- Proposer un plan ou un diff **décrit** sans l'appliquer tant que l'utilisateur n'a pas dit d'appliquer.
- Modification **uniquement** sur les fichiers et le périmètre **cités mot pour mot** dans la requête, avec le **diff minimal** nécessaire.

## En cas de doute

S'arrêter et **poser une question courte** (une clarification) au lieu d'éditer.

## Formulations qui valent accord

Exemples : « modifie shop-nav », « remets l'effet logo », « push », « annule le dernier changement sur heritage-section ».

Formulations qui **ne valent pas** accord : silence, « continue », question ouverte, screenshot seul, sélection navigateur sans consigne d'édition.
```