import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SEO_CONFIG_PATH = path.join(projectRoot, 'src', 'config', 'seo.ts');
const SITEMAP_OUTPUT = path.join(projectRoot, 'public', 'sitemap.xml');
const BASE_URL = 'https://pawdia-ai.com';

const changefreqMap = {
  '/': 'weekly',
  '/create': 'weekly',
  '/ai-pet-portrait-generator': 'weekly',
  '/free-ai-pet-portrait-generator': 'weekly',
  '/ai-pet-portrait': 'weekly',
  '/examples': 'weekly',
  '/blog': 'weekly',
};

const priorityMap = {
  '/': '1.0',
  '/create': '0.9',
  '/ai-pet-portrait-generator': '0.9',
  '/free-ai-pet-portrait-generator': '0.9',
  '/ai-pet-portrait': '0.9',
  '/watercolor-pet-portrait-ai': '0.8',
  '/sketch-pet-portrait-ai': '0.8',
  '/oil-painting-pet-portrait-ai': '0.8',
  '/cartoon-pet-portrait-ai': '0.8',
  '/examples': '0.8',
  '/pricing': '0.7',
  '/subscription': '0.7',
  '/blog': '0.7',
  '/about': '0.6',
  '/contact': '0.6',
  '/privacy': '0.5',
  '/terms': '0.5',
};

const defaultChangefreq = 'monthly';
const defaultPriority = '0.7';

function extractPaths() {
  const content = fs.readFileSync(SEO_CONFIG_PATH, 'utf-8');
  const pathRegex = /path:\s*'([^']+)'/g;
  const paths = new Set();
  let match;
  while ((match = pathRegex.exec(content)) !== null) {
    paths.add(match[1]);
  }
  return Array.from(paths);
}

function buildSitemap(paths) {
  const lastmod = new Date().toISOString().slice(0, 10);

  const urlEntries = paths
    .map((p) => {
      const changefreq = changefreqMap[p] || defaultChangefreq;
      const priority = priorityMap[p] || defaultPriority;
      return [
        '  <url>',
        `    <loc>${BASE_URL}${p}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    '</urlset>',
    '',
  ].join('\n');
}

function main() {
  const paths = extractPaths();
  if (!paths.length) {
    console.error('No paths found in SEO config.');
    process.exit(1);
  }

  const sitemap = buildSitemap(paths);
  fs.writeFileSync(SITEMAP_OUTPUT, sitemap, 'utf-8');
  console.log(`✅ Sitemap generated with ${paths.length} URLs at ${SITEMAP_OUTPUT}`);
}

main();

