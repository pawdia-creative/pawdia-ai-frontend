import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST_DIR = path.resolve('dist');
const HOST = '127.0.0.1';
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;

const routes = [
  '/',
  '/about',
  '/contact',
  '/examples',
  '/privacy',
  '/terms',
  '/cartoon-pet-portrait-ai',
  '/watercolor-pet-portrait-ai',
  '/sketch-pet-portrait-ai',
  '/oil-painting-pet-portrait-ai',
  '/ai-pet-portrait-generator',
  '/free-ai-pet-portrait-generator',
  '/ai-pet-portrait',
];

function routeToOutputPath(route) {
  if (route === '/') return path.join(DIST_DIR, 'index.html');
  const normalized = route.replace(/^\//, '');
  return path.join(DIST_DIR, normalized, 'index.html');
}

async function waitForServerReady(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.ok) return;
    } catch {
      // ignore until server is ready
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('Vite preview server did not become ready in time.');
}

async function main() {
  const preview = spawn(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'preview', '--', '--host', HOST, '--port', String(PORT), '--strictPort'],
    { stdio: 'pipe' }
  );

  preview.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    if (text.trim()) process.stdout.write(`[preview] ${text}`);
  });

  preview.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    if (text.trim()) process.stderr.write(`[preview] ${text}`);
  });

  try {
    await waitForServerReady();

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    for (const route of routes) {
      const url = `${BASE_URL}${route}`;
      console.log(`[prerender] Rendering ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(600);

      const html = await page.content();
      const outputPath = routeToOutputPath(route);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, html, 'utf8');
      console.log(`[prerender] Wrote ${outputPath}`);
    }

    await browser.close();
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('[prerender] Failed:', err);
  process.exit(1);
});

