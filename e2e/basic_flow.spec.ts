import { test, expect } from '@playwright/test';

test('flux de base : login et accès dashboard', async ({ page }) => {
    // 1. Accès page login et vérification redirection forcée
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);

    // 2. Remplissage du formulaire de login
    await page.fill('input[name="email"]', 'admin@ubuntu-pharm.com');
    await page.fill('input[name="password"]', 'Admin_Ubuntu_2026!');
    await page.click('button[type="submit"]');

    // 3. Vérification redirection vers dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1, h2')).toContainText(/Tableau de Bord|Dashboard/i);

    // 4. Navigation vers Inventaire
    await page.click('text=Inventaire');
    await expect(page.locator('h1, h2')).toContainText(/Inventaire|Stocks/i);
});
