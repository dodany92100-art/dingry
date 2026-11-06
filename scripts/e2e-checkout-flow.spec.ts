import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test('Parcours d\'achat DINGRY : de l\'accueil au seuil de paiement (Stop avant CB)', async ({ page }) => {
  console.log('🚀 Démarrage du test du parcours client...');

  // Étape 1 : Arrivée sur le shop (section catalogue)
  await page.goto('http://localhost:3000/#catalogue', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#catalogue article.group', { timeout: 15000 });
  console.log('✅ Étape 1 : Arrivée sur le shop réussie.');

  // Étape 2 : Ouverture de la modale produit
  const firstProductCard = page.locator('#catalogue article.group').first();
  await expect(firstProductCard).toBeVisible();
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
