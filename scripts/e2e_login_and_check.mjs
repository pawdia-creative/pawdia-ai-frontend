#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import playwright from 'playwright';

const OUT_DIR = path.resolve('./scripts/e2e_outputs');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const creds = fs.readFileSync('/tmp/e2e_creds.txt', 'utf8').trim().split(' ');
const EMAIL = creds[0];
const PASSWORD = creds[1];

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const result = { email: EMAIL };
  try {
    await page.goto('https://pawdia-ai.com/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(800);
    // Try common selectors
    const emailSel = 'input[name=\"email\"], input[type=\"email\"], input#email';
    const passSel = 'input[name=\"password\"], input[type=\"password\"], input#password';
    await page.fill(emailSel, EMAIL);
    await page.fill(passSel, PASSWORD);
    // submit - try button[type=submit] or text=Sign In
    try {
      await Promise.all([
        page.click('button[type=\"submit\"]'),
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 })
      ]);
    } catch (e) {
      // fallback: press Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }

    await page.goto('https://pawdia-ai.com/subscription', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const text = await page.evaluate(() => document.body.innerText || '');
    const screenshot = path.join(OUT_DIR, 'subscription_logged_in.png');
    await page.screenshot({ path: screenshot, fullPage: true });

    result.subscription = {
      textSnippet: text.trim().slice(0, 400),
      checks: {
        'Already granted': text.includes('Already granted'),
        'granted at registration': text.includes('granted at registration'),
        '$0': text.includes('$0'),
        '3 credits included': text.includes('3 credits included')
      },
      screenshot
    };
  } catch (err) {
    result.error = String(err);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  const outPath = path.join(OUT_DIR, 'logged_in_results.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})();


