import fs from 'fs';
import { chromium } from 'playwright';

(async()=>{
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36';
  const browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
  const context = await browser.newContext({
    userAgent,
    viewport: { width: 1280, height: 800 },
    bypassCSP: true
  });
  const page = await context.newPage();
  const results = [];
  page.on('console', msg => {
    results.push({type:'console', text: msg.text()});
  });
  page.on('pageerror', err => {
    results.push({type:'pageerror', text: err.message});
  });
  page.on('requestfailed', req => {
    results.push({type:'requestfailed', url: req.url(), failure: req.failure()?.errorText});
  });

  // Unregister service workers
  try {
    await page.goto('https://pawdia-ai.com', { waitUntil: 'load', timeout: 90000 });
  } catch (e) {
    console.warn('Initial navigation failed (load):', e && e.message);
    try {
      await page.goto('https://pawdia-ai.com', { waitUntil: 'networkidle', timeout: 90000 });
    } catch (err) {
      console.warn('Initial navigation failed (networkidle):', err && err.message);
    }
  }
  await page.evaluate(async()=>{ try{ const regs= await navigator.serviceWorker.getRegistrations(); for(const r of regs) await r.unregister(); }catch(e){/*ignore*/} });

  const footerPaths=['/about','/examples','/pricing','/blog','/contact','/privacy','/terms'];
  for(const p of footerPaths){
    try{
      // Try to click footer link to emulate user navigation
      const href = p;
      // Build selector: match anchor with exact href or link text fallback
      const linkByHref = page.locator(`footer a[href="${href}"]`);
      let clicked = false;
      if (await linkByHref.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load', timeout: 90000 }),
          linkByHref.first().click()
        ]);
        clicked = true;
      } else {
        // fallback: click by visible text (About, Examples, Pricing, Blog, Contact, Privacy Policy, Terms of Service)
        const textMap = {
          '/about': 'About',
          '/examples': 'Examples',
          '/pricing': 'Pricing',
          '/blog': 'Blog',
          '/contact': 'Contact',
          '/privacy': 'Privacy Policy',
          '/terms': 'Terms of Service'
        };
        const linkByText = page.locator('footer').locator(`text=${textMap[p]}`);
        if (await linkByText.count() > 0) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'load', timeout: 90000 }),
            linkByText.first().click()
          ]);
          clicked = true;
        }
      }
      if (!clicked) {
        results.push({type:'naverror', path:p, error:'footer link not found'});
        // ensure we're back at home
        await page.goto('https://pawdia-ai.com', { waitUntil: 'load', timeout: 90000 });
        continue;
      }
      await page.waitForTimeout(500);
      const failedRequests = results.filter(r=>r.type==='requestfailed');
      const pageScreenshot = `scripts/e2e_screens${p.replace(/\//g,'_')}.png`;
      await page.screenshot({path: pageScreenshot, fullPage:true});
      results.push({type:'navigated', path:p, url:page.url(), failedRequests, screenshot: pageScreenshot});
      // go back to home before next iteration
      await page.goto('https://pawdia-ai.com', { waitUntil: 'load', timeout: 90000 });
    }catch(e){
      results.push({type:'naverror', path:p, error: e.message});
      try { await page.goto('https://pawdia-ai.com', { waitUntil: 'load', timeout: 90000 }); } catch(_) {}
    }
  }
  await browser.close();
  fs.writeFileSync('scripts/e2e_footer_results.json', JSON.stringify(results, null, 2));
  console.log('E2E results written to scripts/e2e_footer_results.json');
})();


