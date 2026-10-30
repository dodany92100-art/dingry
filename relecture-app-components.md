# Condensé de relecture — `app/` et `components/`

Document de relecture du code source local, au 30 octobre 2026.

Périmètre : uniquement les fichiers `.ts`, `.tsx` et `.css` de `app/` et `components/`.
Hors périmètre, et non lus pour ce document : `.env`, `.env.local`, tout autre fichier d’environnement, `lib/`, `public/`.
Aucune valeur de clé, secret, token, identifiant PayPal ou jeton Redis n’est reproduite. Les noms de variables d’environnement cités le sont comme noms, pas comme valeurs.

Ce condensé décrit l’arbre de travail local. La production (`dingry.com`) sert encore la page teasing ; la boutique locale n’est pas poussée.

---

## Carte

| Fichier | Rôle |
| --- | --- |
| `app/layout.tsx` | Layout racine, métadonnées, `html` en thème clair, bandeau cookies |
| `app/page.tsx` | Accueil local = boutique (`DingryShopPage`) |
| `app/globals.css` | Tailwind 4, thème jour/nuit, animations logo et cartes |
| `app/checkout/page.tsx` | Paiement : devis serveur, Turnstile, boutons PayPal, confirmation |
| `app/admin/layout.tsx` | Coque sombre, `robots` noindex |
| `app/admin/page.tsx` | CRM : login TOTP, produits, commandes |
| `app/api/catalog/route.ts` | Catalogue public, sans cache |
| `app/api/checkout/route.ts` | Devis, création PayPal, capture |
| `app/api/paypal/webhook/route.ts` | Notification PayPal signée |
| `app/api/teaser/route.ts` | Inscription e-mail de la page teasing |
| `app/api/admin/login/route.ts` | Code TOTP ou code de secours |
| `app/api/admin/totp/route.ts` | QR d’enrôlement, seulement s’il est public |
| `app/api/admin/session/route.ts` | Session admin + Blob configuré ou non |
| `app/api/admin/logout/route.ts` | Efface la session |
| `app/api/admin/products/route.ts` | Liste et création produit |
| `app/api/admin/products/[id]/route.ts` | Mise à jour et suppression |
| `app/api/admin/orders/route.ts` | Liste des commandes |
| `app/api/admin/orders/[id]/route.ts` | Avance le statut |
| `components/dingry-shop-page.tsx` | Catalogue, modales, panier |
| `components/dingry-teaser.tsx` | Compte à rebours et formulaire (non monté par `app/page.tsx` en local) |
| `components/paypal-payment-button.tsx` | Boutons PayPal, création de commande |
| `components/TurnstileWidget.tsx` | Contrôle anti-bot |
| `components/cookie-consent.tsx` | Consentement + analytics en production si accepté |
| `components/dingry-logo.tsx` | Logo Cloudinary |
| `components/product-card.tsx` | Carte produit |
| `components/product-image-frame.tsx` | Cadre image |
| `components/shop-footer.tsx` | Pied de page, Instagram, mentions légales |
| `components/ui/*` | Onglets, cartes défilantes, dégradés, badge, bouton |

---

## Accueil et layout

`app/layout.tsx` fixe `lang="fr"` et `data-theme="light"` sur `<html>`. Métadonnées : titre « DINGRY — True Luxury Is Attitude », icônes depuis `lib/dingry-brand`. `CookieConsent` est rendu sur toutes les pages sauf l’admin (le composant se retire lui-même si le chemin commence par `/admin`).

`app/page.tsx` enveloppe `DingryShopPage` dans `Suspense`. Le composant `DingryTeaser` existe encore, mais cette page ne le monte pas.

`app/globals.css` importe Archivo Black, Bebas Neue, Space Grotesk, Tailwind 4 et shadcn. Le thème clair repeint `.dingry-shop` (fond `#f6f6f4`, texte `#161616`). Le thème sombre met le `body` en `#050505`. Le checkout force le sombre le temps de son montage, puis restaure l’attribut précédent.

---

## Boutique — `components/dingry-shop-page.tsx`

Client unique. Le catalogue de secours est le tableau `PRODUCTS` (images Cloudinary, tailles, prix). Le filtre vient de `?category=`. Si `?panier=1` et que le panier session n’est pas vide, le tiroir s’ouvre.

État principal : produits chargés, produit sélectionné, recto/verso, panier, personnalisation (longueur max 28, produit id 24), modales légales.

Actions :

- `addToCart` / `addPersonalizedToCart` / `updateCartQuantity` / `removeFromCart`
- `goToCheckout` enregistre le panier puis navigue vers `/checkout`
- `openProductModal` / `showProductSide` pour les paires hoodie, sweat et les tee-shirts recto/verso
- `selectCatalogFilter` met à jour l’URL

Le bandeau défilant « ROCK THE STREET… » n’est plus dans le JSX. Une ancre vide `id="catalogue-landing"` reste pour le scroll des filtres.

Prix affiché : `cartItemUnitPrice` × quantité. Le montant payé n’est pas celui du client : `/checkout` redemande un devis au serveur.

Composants d’habillage : `ProductCard`, `ProductImageFrame`, `DingryLogo`, `ShopFooter`, `StickyScroll`, `AnimatedTabs`, `InfiniteMovingCards`, `BackgroundGradient`.

---

## Teasing — `components/dingry-teaser.tsx`

Toujours dans le dépôt, non rendu par l’accueil local. Compte à rebours jusqu’au `2026-11-06T00:00:00+01:00` (jours, heures, minutes, secondes). Logo forcé en blanc. Formulaire : validation du format avant envoi, champ leurre `website`, `POST /api/teaser`. Succès : « Merci, vous êtes inscrit. » Doublon : « Vous êtes déjà inscrit. » Le champ est vidé. Lien unique : Instagram `dingry_officiel`.

`app/api/teaser/route.ts` :

1. Leurre rempli → `{ ok: true }` sans enregistrer.
2. E-mail > 180 caractères ou hors motif → 400 « Indiquez une adresse e-mail valide. »
3. Limite 5 / 60 s par IP → 429.
4. Enregistrement indisponible → 503.
5. Sinon `{ ok: true, already }` et `Cache-Control: no-store`.

---

## Checkout

`app/checkout/page.tsx` est un client. Au montage : lit le panier stocké, pose `data-theme="dark"`.

Devis : `POST /api/checkout` avec `intent: "quote"` et les lignes `{ productId, size, qty, personalization? }`. Affichage en euros fixes `entier,centimes €` (pas `toLocaleString`). Paiement possible seulement si le jeton anti-bot est là, le devis est `ready`, et aucune confirmation n’est déjà affichée.

La grille n’est pas un `<form>`. Le bouton « Confirmer la commande » est `type="button"`. Ça évite qu’un envoi GET recharge `/checkout`.

Après approbation PayPal, `registerOrder` envoie `intent: "capture"` avec le jeton, `orderId` et les mêmes lignes. Succès : panier vidé, confirmation gardée. Échec : le jeton est jeté, le widget est remonté (`widgetKey`), l’`orderId` reste en attente.

`components/paypal-payment-button.tsx` :

- Lit seulement le nom `NEXT_PUBLIC_PAYPAL_CLIENT_ID`. S’il est vide, un texte demande de le renseigner. La valeur n’est pas dans ce condensé.
- Options : EUR, `capture`, `fr_FR`, financement carte activé, paylater / venmo / credit désactivés.
- `createOrder` : `POST` `intent: "create"`, retourne l’`orderId` serveur. Le client ne capture pas.
- `forceReRender` ne dépend que de la signature du panier (pas de l’état « occupé »), pour ne pas remonter l’iframe.
- Panneau `#0a0a0a`. Erreur affichée : « Le paiement PayPal n'a pas abouti. Vous pouvez réessayer sans quitter la page. »
- Note : « PayPal reste dans une fenêtre. DINGRY ne quitte pas votre écran. »

`components/TurnstileWidget.tsx` :

- Clé lue via le nom `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- En développement, si cette clé publique est absente, le widget n’est pas rendu et un jeton local est fourni au parent. Aucune clé de test Cloudflare n’est codée en dur.
- En production sans clé, le message « Ajoute NEXT_PUBLIC_TURNSTILE_SITE_KEY… » reste.
- Thème sombre, langue `fr`, action `checkout`.

---

## `POST /api/checkout`

Runtime Node. Ordre :

1. Limite de débit par IP. Sinon 429 avec `Retry-After`.
2. Corps JSON, lignes parsées. Sinon 400 « Commande invalide. »
3. Devis catalogue. Catalogue injoignable → 503. Article absent → 400.
4. `intent: "quote"` → monnaie, total en centimes, lignes. Pas d’appel PayPal.
5. PayPal non configuré → 503 « Paiement indisponible. »
6. `intent: "create"` → commande PayPal, puis brouillon. Si le brouillon échoue hors développement → 503. Réponse : `{ orderId }` seulement.
7. `intent` autre que `capture` → 400.
8. `capture` : vérifie le jeton anti-bot, relit la commande PayPal, ne capture que si le montant et le digest correspondent et que le statut est prêt. Puis persiste. Réponse : confirmation (id, payeur, e-mail, total, articles, livraison).

Les messages d’erreur PayPal ne renvoient pas le corps renvoyé par PayPal.

---

## Webhook PayPal — `app/api/paypal/webhook/route.ts`

`POST` seulement. Corps plafonné à 100 000 octets. Sans en-têtes de signature → 400. Limite de débit, puis vérification de signature. Signature refusée → 401. Webhook non configuré ou stockage indisponible → 503, pour que PayPal réessaie.

Événement ignoré ou sans commande exploitable → `{ received: true }`. Le brouillon Redis est rechargé, le catalogue est requoté si le digest et le total collent, le paiement est relu chez PayPal, puis persisté seulement s’il est vérifié. Un conflit d’enregistrement déjà connu répond quand même `{ received: true }`.

---

## Admin

`app/admin/layout.tsx` : fond `#050505`, police Space Grotesk, non indexé.

`app/admin/page.tsx` : au démarrage `GET /api/admin/session`. Sinon écran de code (6 chiffres ou code de secours) et, si l’API l’autorise, QR d’enrôlement. Deux onglets : commandes et produits. Création produit en `FormData` (image obligatoire). Édition en JSON ou multipart. Stock par delta. Suppression. Statut de commande avancé par `PATCH` sans corps explicite, ou avec un statut valide.

Routes, toutes `runtime = "nodejs"` :

| Route | Accès | Effet |
| --- | --- | --- |
| `POST /api/admin/login` | public, limité | TOTP ou code de secours, pose la session. Les codes de secours ne sont renvoyés qu’après un TOTP accepté |
| `GET /api/admin/totp` | public seulement si l’enrôlement est ouvert | QR, `Cache-Control: no-store` |
| `GET /api/admin/session` | cookie | `{ authenticated, blobEnabled }` ou 401 |
| `POST /api/admin/logout` | — | efface le cookie |
| `GET/POST /api/admin/products` | session | liste, ou création (image validée) |
| `PATCH/DELETE /api/admin/products/[id]` | session | champs partiels, delta de stock, ou suppression |
| `GET /api/admin/orders` | session | liste |
| `PATCH /api/admin/orders/[id]` | session | statut demandé s’il est valide, sinon le suivant |

Le message d’échec de création cite le nom `BLOB_READ_WRITE_TOKEN`. Ce n’est pas une valeur.

---

## Catalogue public

`GET /api/catalog` charge le magasin admin, mappe vers le format vitrine, ignore les fiches invalides. En-tête `Cache-Control: private, no-store, max-age=0`. En cas d’exception : `{ products: [] }` sans code d’erreur.

---

## Cookies

`components/cookie-consent.tsx` lit le choix déjà stocké. Absent → bandeau. Accepté → analytics Vercel, et seulement si `NODE_ENV === "production"`. Refus ou admin : pas d’analytics. La clé de stockage est un nom de préférence, pas un secret.

---

## Points utiles pour la relecture

- Le client envoie des identifiants et des quantités. Les prix payés viennent du devis serveur.
- La capture PayPal et l’enregistrement de commande sont côté serveur. Le bouton ne fait qu’ouvrir la commande et signaler l’approbation.
- Le webhook refuse une notification non signée et ne persiste rien sans brouillon et sans paiement relu.
- L’admin est derrière session, sauf login et QR d’enrôlement (ce dernier seulement s’il est encore public).
- En local, l’accueil est la boutique. `DingryTeaser` et `POST /api/teaser` restent le chemin de la page en ligne.
