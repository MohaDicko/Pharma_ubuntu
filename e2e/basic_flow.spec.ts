import { test, expect } from '@playwright/test';

test('flux de base : login et accès dashboard', async ({ page }) => {
    // 1. Accès page login
    await page.goto('/login');

    // 2. Clic sur accès Démo Admin
    await page.click('button:has-text("Administrateur")');

    // 3. Vérification redirection vers dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h2')).toContainText('Tableau de Bord');

    // 4. Navigation vers Stocks
    await page.click('text=Stocks & Lots');
    await expect(page.locator('h2')).toContainText('Gestion des Stocks');
});
