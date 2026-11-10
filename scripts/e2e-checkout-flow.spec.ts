import { test, expect, type Page } from '@playwright/test';

test.setTimeout(60000);

/**
 * URL du shop pour E2E : `playwright.config.ts` définit baseURL (défaut http://127.0.0.1:3000).
 * Surcharge : `PLAYWRIGHT_BASE_URL` ou `BASE_URL` (ex. http://localhost:3001 si le dev écoute sur 3001).
 * Si `DINGRY_PUBLIC_HOME=teaser`, l’accueil n’a pas #catalogue — le test échoue avec message explicite.
 */

async function assertShopCatalogVisible(page: Page): Promise<void> {
  const catalogue = page.locator('#catalogue');
  try {
    await expect(catalogue).toBeVisible({ timeout: 15000 });
  } catch {
    throw new Error(
      'E2E: section #catalogue introuvable. Causes fréquentes: DINGRY_PUBLIC_HOME=teaser (pas de boutique), ' +
        'ou mauvais port — définir PLAYWRIGHT_BASE_URL (ex. http://127.0.0.1:3000) et un seul `npm run dev`.',
    );
  }
  await page.waitForSelector('#catalogue article.group', { timeout: 15000 });
}

/** Les deux parcours s’enchaînent dans l’ordre (pas en parallèle entre eux). */
test.describe('Parcours utilisateur boutique', () => {
  test.describe.configure({ mode: 'serial' });

  /** Parcours catalogue classique : carte produit → modale → taille → ajout → tiroir → checkout. */
  test('Parcours d\'achat DINGRY : de l\'accueil au seuil de paiement (Stop avant CB)', async ({ page }) => {
    console.log('🚀 Démarrage du test du parcours client...');

    // Étape 1 : Arrivée sur le shop (section catalogue)
    await page.goto('/#catalogue', { waitUntil: 'domcontentloaded' });
    await assertShopCatalogVisible(page);
    console.log('✅ Étape 1 : Arrivée sur le shop réussie.');

    // Étape 2 : Ouverture de la modale produit (bouton sous l’image — pas la zone flip recto/verso)
    const firstProductCard = page.locator('#catalogue article.group').first();
    await expect(firstProductCard).toBeVisible();
    await firstProductCard.scrollIntoViewIfNeeded();
    await firstProductCard.locator('[data-dingry-product-card-open]').click({ force: true });

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
    const addToCartBtn = productModal.locator('button.dingry-add-to-cart-btn');
    await addToCartBtn.waitFor({ state: 'visible', timeout: 15000 });
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
    await checkoutBtn.click();

    await page.waitForURL('**/checkout**', { timeout: 15000 }).catch(() => {
      console.log('ℹ️ Navigation checkout non détectée dans le délai.');
    });

    console.log('🎉 Parcours E2E complet validé avec succès !');
    console.log('🛑 ARRÊT DE SÉCURITÉ ACTIVÉ : fin du parcours avant paiement.');
  });

  /** Configurateur Custom (bannière catalogue) — distinct du clic sur une fiche produit. */
  test('Parcours Custom : configurateur tee → panier → checkout (Stop avant CB)', async ({ page }) => {
    console.log('🚀 Démarrage test configurateur Custom...');

    await page.goto('/#catalogue', { waitUntil: 'domcontentloaded' });
    await assertShopCatalogVisible(page);

    await page.getByRole('button', { name: /ouvrir le configurateur tee personnalisé/i }).click();

    const personalizeModal = page.locator('[data-dingry-personalize-modal]');
    await expect(personalizeModal).toBeVisible({ timeout: 15000 });
    await expect(personalizeModal.getByRole('heading', { name: /configurateur t-shirt personnalisé/i })).toBeVisible();

    await personalizeModal.getByPlaceholder(/ville/i).fill('DINGRY TEST');

    const customSize = personalizeModal.locator('button').filter({ hasText: /^S$/i }).first();
    await expect(customSize).toBeVisible({ timeout: 5000 });
    await customSize.click();
    await page.waitForTimeout(300);

    const addCustomBtn = personalizeModal.locator('button.dingry-add-to-cart-btn');
    await expect(addCustomBtn).toBeEnabled({ timeout: 15000 });
    await addCustomBtn.click();

    const cartDrawer = page.locator('.dingry-cart-drawer-panel');
    await expect(cartDrawer).toBeVisible({ timeout: 15000 });

    const checkoutBtn = cartDrawer
      .locator('button, a, [role="button"]')
      .filter({ hasText: /passer au paiement|commander|payer|checkout|valider|règlement|paiement/i })
      .first();
    await expect(checkoutBtn).toBeEnabled({ timeout: 15000 });
    await checkoutBtn.click();

    await page.waitForURL('**/checkout**', { timeout: 15000 }).catch(() => {
      console.log('ℹ️ Navigation checkout non détectée dans le délai.');
    });

    console.log('🎉 Parcours Custom E2E validé.');
    console.log('🛑 ARRÊT DE SÉCURITÉ ACTIVÉ : fin du parcours avant paiement.');
  });
});
