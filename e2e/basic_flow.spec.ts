import { test, expect } from '@playwright/test';

test('flux de base : login et accès dashboard', async ({ page }) => {
    // 1. Accès page login et vérification redirection forcée
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);

    // 2. Remplissage du formulaire de login
    await page.fill('input[name="email"]', 'aziz');
    await page.fill('input[name="password"]', 'aziz');
    await page.click('button[type="submit"]');

    // 3. Vérification redirection vers dashboard
    await expect(page).toHaveURL('/');

    // FIX : On force le rechargement navigateur pour réinitialiser le cache NextAuth côté client
    await page.reload();

    // Attendre de manière résiliente que le loader disparaisse
    await expect(page.getByText(/Vérification des accès/i)).toBeHidden({ timeout: 15000 });

    // On observe le vrai contenu de la page (Le titre "Bonjour")
    await expect(page.getByText(/Synchronisation des données/i)).toBeHidden({ timeout: 15000 });
    await expect(page.locator('h1, h2')).toContainText(/Bonjour/i, { timeout: 15000 });

    // 4. Navigation vers Inventaire
    await page.click('text=Stocks & Lots');
    await expect(page.locator('h1, h2')).toContainText(/Gestion des Stocks|Inventaire|Stocks/i);
});
