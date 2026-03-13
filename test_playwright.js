const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto('http://localhost:3000/');
    console.log("URL:", page.url());

    await page.fill('input[name="email"]', 'aziz');
    await page.fill('input[name="password"]', 'aziz');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);
    console.log("URL after login:", page.url());

    const session = await page.evaluate(async () => {
        const r = await fetch('/api/auth/session');
        return await r.json();
    });

    console.log("SESSION:", session);

    await browser.close();
})();
