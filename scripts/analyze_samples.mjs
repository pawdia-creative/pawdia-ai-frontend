#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const BASE_DIR = path.resolve('./public/temp-samples');

async function listStyles() {
  try {
    const items = await fs.readdir(BASE_DIR, { withFileTypes: true });
    return items.filter(i => i.isDirectory()).map(d => d.name);
  } catch (e) {
    console.error('Failed to read temp-samples directory:', e);
    return [];
  }
}

function shannonEntropy(buffer) {
  const freq = new Map();
  for (const b of buffer) {
    freq.set(b, (freq.get(b) || 0) + 1);
  }
  const len = buffer.length;
  let ent = 0;
  for (const [, v] of freq) {
    const p = v / len;
    ent -= p * Math.log2(p);
  }
  return ent;
}

async function analyzeStyle(style) {
  const styleDir = path.join(BASE_DIR, style);
  const variants = await fs.readdir(styleDir, { withFileTypes: true });
  const results = {};
  for (const v of variants.filter(d => d.isDirectory())) {
    const variantName = v.name;
    const variantDir = path.join(styleDir, variantName);
    const files = await fs.readdir(variantDir);
    const images = files.filter(f => /\.(jpe?g|png)$/i.test(f));
    const stats = [];
    for (const img of images) {
      const imgPath = path.join(variantDir, img);
      try {
        const buf = await fs.readFile(imgPath);
        const size = buf.length;
        const ent = shannonEntropy(buf);
        stats.push({ file: img, size, entropy: ent });
      } catch (e) {
        console.warn('Failed to read', imgPath, e);
      }
    }
    if (stats.length > 0) {
      const avgSize = stats.reduce((s,x)=>s+x.size,0)/stats.length;
      const avgEnt = stats.reduce((s,x)=>s+x.ent,0)/stats.length;
      results[variantName] = { count: stats.length, avgSize, avgEnt, samples: stats.slice(0,3) };
    } else {
      results[variantName] = { count: 0 };
    }
  }
  return results;
}

function recommendAdjustments(styleId, baseline, enhanced) {
  const rec = { styleId, baseline, enhanced, suggestions: [] };
  // Compare entropy and size
  if (!baseline || !enhanced) {
    rec.suggestions.push('Insufficient data to analyze. Ensure both baseline and enhanced images exist.');
    return rec;
  }
  const entDiff = enhanced.avgEnt - baseline.avgEnt;
  const sizeRatio = enhanced.avgSize / (baseline.avgSize || 1);

  // If enhanced not notably higher entropy or size, suggest raising params
  if (entDiff < 0.5 || sizeRatio < 1.05) {
    // style-specific defaults
    if (styleId.includes('oil') || styleId.includes('popart')) {
      rec.suggestions.push('Increase steps by +6~8 and cfgScale by +1.0; consider sampler DPM++ 2M Karras.');
    } else if (styleId.includes('watercolor')) {
      rec.suggestions.push('Increase steps by +4~6 and cfgScale by +0.5; emphasize wet-on-wet phrases in prompt.');
    } else if (styleId.includes('sketch') || styleId.includes('pencil')) {
      rec.suggestions.push('Increase steps by +4~6 and cfgScale by +0.5; emphasize cross-hatching and contrast.');
    } else if (styleId.includes('ink')) {
      rec.suggestions.push('Increase steps by +4~6 and cfgScale by +0.5; emphasize bold brush strokes and high contrast.');
    } else if (styleId.includes('crayon')) {
      rec.suggestions.push('Increase cfgScale by +0.5 and steps by +2~4; emphasize wax texture and pigment buildup.');
    } else {
      rec.suggestions.push('Increase steps by +4 and cfgScale by +0.5 and rerun A/B.');
    }
  } else {
    rec.suggestions.push('Enhanced prompt shows measurable increase in entropy; parameters seem sufficient. Consider minor tuning only.');
  }

  // If enhanced very large size, consider lowering to save cost
  if (sizeRatio > 1.5) {
    rec.suggestions.push('Enhanced images are significantly larger; consider reducing image resolution or steps to save cost.');
  }

  return rec;
}

async function main() {
  const styles = await listStyles();
  if (styles.length === 0) {
    console.log('No styles found in', BASE_DIR);
    return;
  }
  const all = {};
  for (const s of styles) {
    const res = await analyzeStyle(s);
    all[s] = res;
  }
  // Produce recommendations
  const recs = [];
  for (const s of styles) {
    const baseline = all[s].baseline;
    const enhanced = all[s].enhanced;
    const r = recommendAdjustments(s, baseline, enhanced);
    recs.push(r);
  }

  // Save analysis report
  const out = { generatedAt: new Date().toISOString(), stats: all, recommendations: recs };
  await fs.writeFile(path.join(process.cwd(), 'public', 'temp-samples', 'analysis_report.json'), JSON.stringify(out, null, 2));
  console.log('Analysis complete. Report saved to public/temp-samples/analysis_report.json');
  console.log(JSON.stringify(recs, null, 2));
}

main().catch(err => {
  console.error('Analysis failed:', err);
  process.exit(1);
});


