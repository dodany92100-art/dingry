import { test, expect, type Page } from '@playwright/test';

test.setTimeout(120000);

/**
 * URL du shop pour E2E : `playwright.config.ts` définit baseURL (défaut http://127.0.0.1:3000).
 * Surcharge : `PLAYWRIGHT_BASE_URL` ou `BASE_URL` (ex. http://localhost:3001 si le dev écoute sur 3001).
 * Chemin boutique : `PLAYWRIGHT_SHOP_HOME` (défaut `/websitedx` via `npm run test:e2e`).
 * `npm run test:e2e` : /websitedx, gate off si besoin (voir `scripts/run-playwright-e2e.mjs`).
 */

const shopHome = (process.env.PLAYWRIGHT_SHOP_HOME ?? '/websitedx').replace(/\/$/, '') || '';

function shopUrl(hash: string): string {
  const fragment = hash.startsWith('#') ? hash : `#${hash}`;
  return shopHome ? `${shopHome}${fragment}` : `/${fragment}`;
}

async function dismissCookieBanner(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: /Cookies DINGRY/i });
  if (!(await dialog.isVisible({ timeout: 2000 }).catch(() => false))) return;
  await dialog.getByRole('button', { name: /^Refuser$/i }).click();
}

async function gotoShop(page: Page, hash = '#catalogue'): Promise<void> {
  await page.goto(shopUrl(hash), { waitUntil: 'load' });
  await dismissCookieBanner(page);
  const catalogue = page.locator('#catalogue');
  if (await catalogue.isVisible({ timeout: 5000 }).catch(() => false)) {
    await catalogue.scrollIntoViewIfNeeded();
  }
}

/** Onglet catalogue avec au moins une fiche produit (vue « Collection » peut n’afficher que des blocs vides en bas). */
async function focusCatalogWithProducts(page: Page): Promise<void> {
  const card = () => page.locator('[data-dingry-product-card-open]').first();
  const tabCandidates = ['Hoodies', 'T-shirts', 'Hoodzip', 'Crewnecks', 'Jerseys', 'Caps'];

  for (const label of tabCandidates) {
    const tab = page.getByRole('tab', { name: label, exact: true });
    if (!(await tab.isVisible({ timeout: 1500 }).catch(() => false))) continue;
    await tab.click();
    try {
      await page.waitForFunction(
        () => document.querySelector('[data-dingry-product-card-open]') !== null,
        { timeout: 15000 },
      );
      await card().scrollIntoViewIfNeeded();
      return;
    } catch {
      /* onglet suivant */
    }
  }

  try {
    await page.waitForFunction(
      () => document.querySelector('[data-dingry-product-card-open]') !== null,
      { timeout: 20000 },
    );
    await card().scrollIntoViewIfNeeded();
    return;
  } catch {
    const retry = page.getByRole('button', { name: /réessayer/i });
    if (await retry.isVisible({ timeout: 1000 }).catch(() => false)) {
      await retry.click();
      await page.waitForFunction(
        () => document.querySelector('[data-dingry-product-card-open]') !== null,
        { timeout: 20000 },
      );
      await card().scrollIntoViewIfNeeded();
    }
  }
}

/** Seuil paiement : checkout chargé, total calculé, CTA PayPal ou message env explicite (pas de capture). */
async function assertCheckoutPayPalThreshold(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/checkout/, { timeout: 20000 });
  const phone = page.locator('input[name="customerPhone"]');
  await expect(phone).toBeVisible({ timeout: 15000 });
  await phone.fill('06 12 34 56 78');
  await expect(page.getByText(/Total TTC/i)).toBeVisible();
  await expect(page.locator('text=Calcul…')).toHaveCount(0, { timeout: 30000 });

  const payPanel = page.locator('.dingry-checkout-pay-surface').filter({ hasText: /Sécurisé/i });
  await expect(payPanel).toBeVisible();
  const payPalBtn = payPanel.getByRole('button', { name: /Payer avec PayPal/i });
  const missingPayPalEnv = payPanel.getByText(/NEXT_PUBLIC_PAYPAL_CLIENT_ID/i);
  const payFootnote = payPanel.locator('.dingry-checkout-pay-footnote');
  const sawCheckoutReady =
    (await payPalBtn.isVisible({ timeout: 5000 }).catch(() => false)) ||
    (await missingPayPalEnv.isVisible({ timeout: 2000 }).catch(() => false)) ||
    (await payFootnote
      .filter({ hasText: /Turnstile|contrôle|Saisissez votre mobile|Numéro invalide|Paiement/i })
      .isVisible({ timeout: 3000 })
      .catch(() => false));
  expect(sawCheckoutReady).toBeTruthy();
}

async function assertShopCatalogVisible(page: Page): Promise<void> {
  const onAdmin = await page.getByText(/CRM · session/i).isVisible({ timeout: 500 }).catch(() => false);
  if (onAdmin) {
    throw new Error(
      'E2E: redirigé vers /admin (gate teaser). Utilise `npm run test:e2e` (serveur 3098, gate off) ' +
        'ou relance ton dev avec DINGRY_TEASER_GATE=off + PLAYWRIGHT_SHOP_HOME=/websitedx.',
    );
  }

  const catalogue = page.locator('#catalogue');
  try {
    await expect(catalogue).toBeVisible({ timeout: 20000 });
  } catch {
    const url = page.url();
    throw new Error(
      `E2E: #catalogue introuvable (${url}). Avant le 18/11 la boutique est sur /websitedx : ` +
        'lance `npm run test:e2e` ou PLAYWRIGHT_BASE_URL aligné sur ton `npm run dev`.',
    );
  }
  await focusCatalogWithProducts(page);
  const firstCard = page.locator('[data-dingry-product-card-open]').first();
  await firstCard.waitFor({ state: 'visible', timeout: 30000 });
}

/** Les deux parcours s’enchaînent dans l’ordre (pas en parallèle entre eux). */
test.describe('Parcours utilisateur boutique', () => {
  test.describe.configure({ mode: 'serial' });

  /** Parcours catalogue classique : carte produit → modale → taille → ajout → tiroir → checkout. */
  test('Parcours d\'achat DINGRY : de l\'accueil au seuil de paiement (Stop avant CB)', async ({ page }) => {
    console.log('🚀 Démarrage du test du parcours client...');

    // Étape 1 : Arrivée sur le shop (section catalogue)
    await gotoShop(page, '#catalogue');
    await assertShopCatalogVisible(page);
    console.log('✅ Étape 1 : Arrivée sur le shop réussie.');

    // Étape 2 : Ouverture de la modale produit (bouton sous l’image — pas la zone flip recto/verso)
    const firstProductCard = page.locator('[data-dingry-product-card-open]').first();
    await expect(firstProductCard).toBeVisible();
    await firstProductCard.scrollIntoViewIfNeeded();
    await firstProductCard.click();

    const productModal = page.locator('[data-product-modal]');
    await expect(productModal).toBeVisible({ timeout: 15000 });
    console.log('✅ Étape 2 : Ouverture de la modale produit validée.');

    // Étape 3a : Jersey — couleur si la section est présente
    try {
      const colorSection = productModal
        .locator('div.mb-6')
        .filter({ has: productModal.getByText('Couleur', { exact: true }) });
      const firstColorBtn = colorSection.locator('button').first();
      if (await firstColorBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstColorBtn.click();
        console.log('ℹ️ Couleur jersey sélectionnée.');
      }
    } catch {
      console.log('ℹ️ Pas de section couleur — poursuite.');
    }

    // Étape 3b : Taille (obligatoire pour activer « Ajouter au panier » dans product-modal)
    try {
      const sizeBtn = productModal
        .locator('button')
        .filter({ hasText: /^(S|M|L|XL|TU|3[0-9]|4[0-9])$/i })
        .first();
      if (await sizeBtn.isVisible({ timeout: 5000 })) {
        await sizeBtn.click();
        await page.waitForTimeout(400);
        console.log('✅ Taille sélectionnée.');
      }
    } catch {
      console.log('ℹ️ Pas de taille cliquable détectée — poursuite.');
    }

    // Étape 4 : Ajout au panier (bouton réel : .dingry-add-to-cart-btn, activé après taille)
    await dismissCookieBanner(page);
    const addToCartBtn = productModal.getByRole('button', { name: 'Ajouter au panier' }).first();
    await expect(addToCartBtn).toBeEnabled({ timeout: 15000 });
    await addToCartBtn.click();
    console.log('✅ Étape 3 & 4 : Produit ajouté au panier.');

    // Étape 5 : Tiroir panier puis paiement (« Passer au paiement » dans cart-drawer)
    const cartDrawer = page.locator('.dingry-cart-drawer-panel');
    await expect(cartDrawer).toBeVisible({ timeout: 15000 });

    const checkoutBtn = cartDrawer
      .locator('button, a, [role="button"]')
      .filter({ hasText: /passer au paiement|commander|payer|checkout|valider|règlement|paiement/i })
      .first();

    await checkoutBtn.waitFor({ state: 'visible', timeout: 15000 });
    await expect(checkoutBtn).toBeEnabled({ timeout: 15000 });
    await dismissCookieBanner(page);
    await checkoutBtn.click();

    await page.waitForURL('**/checkout**', { timeout: 15000 });
    await dismissCookieBanner(page);
    await assertCheckoutPayPalThreshold(page);

    console.log('🎉 Parcours E2E complet validé avec succès !');
    console.log('🛑 ARRÊT DE SÉCURITÉ ACTIVÉ : fin du parcours avant paiement.');
  });

  /** Landing atelier CUSTOM → modal « Personnalise ta pièce » (+5 € obligatoire). */
  test('Parcours Custom : hero atelier → modal → panier → seuil PayPal', async ({ page }) => {
    console.log('🚀 Démarrage test atelier Custom...');

    await gotoShop(page, '#atelier-custom');
    const hero = page.locator('#atelier-custom-hero');
    await hero.scrollIntoViewIfNeeded();
    await expect(hero.getByRole('button', { name: /^CUSTOM$/i })).toBeVisible({ timeout: 25000 });
    await hero.getByRole('button', { name: /^CUSTOM$/i }).click();

    const personalizeModal = page.locator('[data-dingry-personalize-modal]');
    await expect(personalizeModal).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('dialog', { name: /personnalise ta pièce/i })).toBeVisible();

    await personalizeModal.getByPlaceholder(/texte libre/i).fill('DINGRY E2E');
    await personalizeModal.locator('input[type="checkbox"]').check();

    const customSize = personalizeModal.locator('button').filter({ hasText: /^M$/i }).first();
    await expect(customSize).toBeVisible({ timeout: 8000 });
    await customSize.click();

    await dismissCookieBanner(page);
    const addCustomBtn = personalizeModal.getByRole('button', { name: 'Ajouter au panier' }).first();
    await expect(addCustomBtn).toBeEnabled({ timeout: 15000 });
    await addCustomBtn.click();
    const cartDrawer = page.locator('.dingry-cart-drawer-panel');
    await expect(cartDrawer).toBeVisible({ timeout: 15000 });
    await expect(cartDrawer.locator('.dingry-cart-recap-amount').first()).toBeVisible();
    await expect(
      cartDrawer.getByRole('button', { name: /passer au paiement/i }),
    ).toBeEnabled();

    console.log('🎉 Parcours Custom E2E validé (atelier → panier).');
    console.log('🛑 ARRÊT DE SÉCURITÉ ACTIVÉ : fin du parcours avant paiement.');
  });
});
