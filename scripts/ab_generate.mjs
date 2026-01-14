#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const TOKEN = process.argv[2];
if (!TOKEN) {
  console.error('Usage: node scripts/ab_generate.mjs <ADMIN_TOKEN>');
  process.exit(1);
}

const OUT_DIR = path.resolve('./public/temp-samples');
const API_URL = process.env.API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api/generate';

const styles = [
  { id: 'watercolor', name: 'Watercolor' },
  { id: 'sketch', name: 'Pencil Sketch' },
  { id: 'oil', name: 'Oil Painting' },
  { id: 'cartoon', name: 'Urban Comic' },
  { id: 'ink', name: 'Chinese Ink Painting' },
  { id: 'crayon', name: 'Crayon' },
  { id: 'popart', name: 'Pop Art' },
];

const negativeCommon = 'blurry, low quality, low resolution, rotated, flipped, different pose, different animal, distorted anatomy, artifacts, noise';

function mildPrompt(styleName) {
  return `Convert this pet photo into a ${styleName} style with gentle, visible stylistic cues while preserving composition and pose. Subtle rendering, maintain anatomy and background.`;
}

function strongPrompt(styleName) {
  switch (styleName) {
    case 'Oil Painting':
      return 'Convert this pet photo into a dramatic Old Masters oil painting in the Rembrandt tradition: heavy impasto, deep chiaroscuro, warm palette, visible brush texture, tactile paint layers. Preserve composition and pose.';
    case 'Watercolor':
      return 'Transform into an expressive Sargent‑style watercolor: strong wet‑on‑wet blooms, translucent layered washes, granulation, soft edge diffusion, paper texture visible. Preserve composition and pose.';
    case 'Urban Comic':
      return 'Convert to high‑impact pop/urban comic poster: Lichtenstein‑style halftone, thick black outlines, posterized flat color blocks, dramatic rim lighting. Preserve pose and composition.';
    case 'Chinese Ink Painting':
      return 'Render as bold Shuimo Chinese ink painting: calligraphic brush strokes, rich ink gradation from deep black to pale grey, intentional negative space, rice paper texture, preserve pose.';
    case 'Crayon':
      return 'Convert into vivid crayon/colored‑wax artwork: chunky wax strokes, heavy pigment buildup, saturated primaries, visible paper tooth, preserve pose.';
    case 'Pencil Sketch':
      return 'Render as professional graphite pencil sketch with strong cross‑hatching, deep chiaroscuro, crisp fur edge detail and visible paper grain, preserve pose.';
    case 'Pop Art':
      return 'Create bold pop art poster style: high contrast, vivid saturated palette, halftone textures and graphic shapes; preserve composition and pose.';
    default:
      return `Convert this pet photo into a strongly stylized ${styleName} rendering with clear, pronounced stylistic cues. Preserve composition and pose.`;
  }
}

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function readImageAsBase64(p) {
  const b = await fs.readFile(p);
  return b.toString('base64');
}

async function saveBase64Image(base64, outPath) {
  const buf = Buffer.from(base64, 'base64');
  await fs.writeFile(outPath, buf);
}

async function fetchAndSaveImageUrl(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image url: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  await fs.writeFile(outPath, buf);
}

async function run() {
  console.log('Starting A/B generation for styles:', styles.map(s=>s.id).join(', '));
  for (const style of styles) {
    // Prefer style-specific original, fall back to memorial sample if missing
    const styleOrigPath = path.resolve('./public/examples', style.id, 'original.jpg');
    const fallbackOrigPath = path.resolve('./public/examples', 'memorial', 'original-cat.jpg');
    let origPath = styleOrigPath;
    try {
      await fs.access(styleOrigPath);
    } catch (e) {
      // fallback
      try {
        await fs.access(fallbackOrigPath);
        origPath = fallbackOrigPath;
        console.log(`Using fallback original for style ${style.id}: ${fallbackOrigPath}`);
      } catch (e2) {
        console.warn(`Original not found for style ${style.id} at ${styleOrigPath} and no fallback available, skipping.`);
        continue;
      }
    }

    const b64 = await readImageAsBase64(origPath);
    const variants = [
      { name: 'baseline', prompt: mildPrompt(style.name), steps: 28, cfgScale: 7.0 },
      { name: 'enhanced', prompt: strongPrompt(style.name), steps: 34, cfgScale: 8.5 }
    ];

    for (const variant of variants) {
      const outDir = path.join(OUT_DIR, style.id, variant.name);
      await ensureDir(outDir);
      for (let i=1;i<=3;i++) {
        console.log(`Generating ${style.id} ${variant.name} sample ${i}...`);
        const body = {
          prompt: variant.prompt,
          width: 1024,
          height: 1024,
          steps: variant.steps,
          cfgScale: variant.cfgScale,
          negativePrompt: negativeCommon,
          imageBase64: b64,
          imageMimeType: 'image/jpeg',
          image_strength: 0.15
        };
        try {
          const resp = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify(body)
          });
          if (!resp.ok) {
            const txt = await resp.text();
            console.error(`Generate failed for ${style.id}/${variant.name}/${i}:`, resp.status, txt);
            if (resp.status === 403) {
              console.error('Provider quota issue detected. Stopping batch.');
              return;
            }
            continue;
          }
          const data = await resp.json();
          if (data.base64 || data.b64_json || (data.raw && data.raw.base64)) {
            const base = data.base64 || data.b64_json || (data.raw && data.raw.base64);
            const outPath = path.join(outDir, `${i}.jpg`);
            await saveBase64Image(base, outPath);
            console.log('Saved', outPath);
          } else if (data.imageUrl) {
            const outPath = path.join(outDir, `${i}.jpg`);
            await fetchAndSaveImageUrl(data.imageUrl, outPath);
            console.log('Saved', outPath);
          } else if (data.raw && typeof data.raw === 'object') {
            const rawStr = JSON.stringify(data.raw);
            const idx = rawStr.indexOf('data:image/');
            if (idx !== -1) {
              const substr = rawStr.slice(idx);
              const comma = substr.indexOf(',');
              if (comma !== -1) {
                const tail = substr.slice(comma + 1);
                const m2 = tail.match(/^([A-Za-z0-9+/=\r\n]+)/);
                if (m2) {
                  const base = m2[1].replace(/\s+/g, '');
                  const outPath = path.join(outDir, `${i}.jpg`);
                  await saveBase64Image(base, outPath);
                  console.log('Saved (from raw) ', outPath);
                } else {
                  const outPath = path.join(outDir, `${i}.json`);
                  await fs.writeFile(outPath, JSON.stringify(data.raw, null, 2));
                  console.log('Saved raw JSON to', outPath);
                }
              } else {
                const outPath = path.join(outDir, `${i}.json`);
                await fs.writeFile(outPath, JSON.stringify(data.raw, null, 2));
                console.log('Saved raw JSON to', outPath);
              }
            } else {
              const outPath = path.join(outDir, `${i}.json`);
              await fs.writeFile(outPath, JSON.stringify(data, null, 2));
              console.log('Saved response JSON to', outPath);
            }
          } else {
            const outPath = path.join(outDir, `${i}.json`);
            await fs.writeFile(outPath, JSON.stringify(data, null, 2));
            console.log('Saved response JSON to', outPath);
          }
        } catch (err) {
          console.error('Generation error for', style.id, variant.name, i, err);
        }
      }
    }
  }
  console.log('A/B generation run complete. Output directory:', OUT_DIR);
}

run().catch(err => {
  console.error('Batch generation script failed:', err);
  process.exit(1);
});


