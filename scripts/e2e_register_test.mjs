import fs from 'fs';
import { chromium } from 'playwright';

(async () => {
  const results = { console: [], pageerror: [], requestfailed: [], requests: [], responses: [], navigations: [] };
  const userEmail = `e2e_test_${Date.now()}@example.com`;
  const userPassword = 'Testpass1!';

  const browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    bypassCSP: true,
  });
  const page = await context.newPage();

  page.on('console', msg => {
    results.console.push({ text: msg.text(), type: msg.type() });
  });
  page.on('pageerror', err => {
    results.pageerror.push({ message: err.message, stack: err.stack });
  });
  page.on('requestfailed', req => {
    results.requestfailed.push({ url: req.url(), failure: req.failure()?.errorText });
  });
  // capture POST payloads for auth endpoints
  page.on('request', req => {
    try {
      const url = req.url();
      const method = req.method();
      if (method === 'POST' && /\/auth\//.test(url)) {
        results.requests.push({ url, method, postData: req.postData() });
      }
    } catch (e) {
      // ignore
    }
  });
  // capture responses including status, headers and small body for API endpoints
  page.on('response', async res => {
    try {
      const url = res.url();
      const status = res.status();
      const headers = res.headers();
      if (/\/auth\//.test(url) || /\/api\//.test(url)) {
        let body = null;
        try {
          const ct = (headers['content-type'] || headers['Content-Type'] || '').toLowerCase();
          if (ct.includes('application/json') || ct.includes('text/')) {
            const text = await res.text();
            body = text.length > 20000 ? text.slice(0, 20000) + '...[truncated]' : text;
          }
        } catch (e) {
          body = `<<failed to read body: ${String(e)}>>`;
        }
        results.responses.push({ url, status, headers, body });
      } else {
        results.responses.push({ url, status });
      }
    } catch (e) {
      // ignore
    }
  });

  try {
    // go to register page
    await page.goto('https://pawdia-ai.com/register', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      // unregister service workers to avoid cached handlers
      try { navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister())); } catch(e) {}
    });

    // fill registration form - try common selectors
    const emailSel = 'input[type="email"], input#email, input[name="email"]';
    const nameSel = 'input#name, input[name="name"], input[placeholder="Name"]';
    const passSel = 'input[type="password"], input#password, input[name="password"]';
    const confirmSel = 'input#confirmPassword, input[name="confirmPassword"], input[placeholder="Confirm password"]';
    const submitSel = 'button[type="submit"], button:has-text("Sign up"), button:has-text("Register"), button:has-text("Sign Up")';

    await page.fill(nameSel, 'E2E Tester').catch(()=>{});
    await page.fill(emailSel, userEmail).catch(()=>{});
    await page.fill(passSel, userPassword).catch(()=>{});
    await page.fill(confirmSel, userPassword).catch(()=>{});
    await page.waitForTimeout(500);

    // click submit
    const clicked = await page.locator(submitSel).first().click().catch(()=>null);
    // wait for network or navigation
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(()=>{});

    // capture screenshot
    const screenshotPath = `scripts/e2e_register_${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    results.navigations.push({ url: page.url(), screenshot: screenshotPath });

    // collect network failures summary
    results.summary = {
      emailUsed: userEmail,
      passwordUsed: userPassword.replace(/./g,'*'),
      timestamp: Date.now(),
    };

  } catch (err) {
    results.error = { message: (err && err.message) ? err.message : String(err) };
  } finally {
    await browser.close();
    fs.writeFileSync('scripts/e2e_register_results.json', JSON.stringify(results, null, 2));
    console.log('E2E register results written to scripts/e2e_register_results.json');
  }
})();


