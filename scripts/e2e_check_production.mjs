#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import playwright from 'playwright';

const OUT_DIR = path.resolve('./scripts/e2e_outputs');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { name: 'home', url: 'https://pawdia-ai.com/' },
  { name: 'subscription', url: 'https://pawdia-ai.com/subscription' },
  { name: 'contact', url: 'https://pawdia-ai.com/contact' },
  { name: 'email_verify_placeholder', url: 'https://pawdia-ai.com/verify' }
];

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const results = [];

  for (const t of targets) {
    const page = await context.newPage();
    let ok = true;
    let error = null;
    try {
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 30000 });
      // wait a moment for SPA rendering
      await page.waitForTimeout(1200);
      const html = await page.content();
      const text = await page.evaluate(() => document.body.innerText || '');
      const screenshotPath = path.join(OUT_DIR, `${t.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // checks for subscription page specifics
      const checks = {
        'Already granted': text.includes('Already granted'),
        'granted at registration': text.includes('granted at registration'),
        '$0': text.includes('$0'),
        '3 credits included': text.includes('3 credits included'),
      };

      results.push({
        name: t.name,
        url: t.url,
        status: 'ok',
        checks,
        screenshot: screenshotPath,
        sampleText: text.trim().slice(0, 200),
        htmlSnippet: html.trim().slice(0, 400)
      });
    } catch (e) {
      ok = false;
      error = String(e);
      results.push({
        name: t.name,
        url: t.url,
        status: 'error',
        error,
      });
    } finally {
      try { await page.close(); } catch {}
    }
  }

  await browser.close();
  const outPath = path.join(OUT_DIR, 'results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  console.log('Screenshots and results written to', OUT_DIR);
})();


