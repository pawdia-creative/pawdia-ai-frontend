import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const inputPath = 'src/assets/hero-pets.jpg';
const outputDir = 'src/assets';

async function optimizeHeroImage() {
  try {
    // Check if input file exists
    await fs.access(inputPath);

    // Get original dimensions
    const metadata = await sharp(inputPath).metadata();
    console.log(`Original hero: ${metadata.width}x${metadata.height}, ${metadata.format}`);

    // Generate multiple sizes for responsive images
    const sizes = [
      { width: 800, suffix: 'sm', quality: 85 },
      { width: 1200, suffix: 'md', quality: 85 },
      { width: 1600, suffix: 'lg', quality: 80 },
      { width: 2000, suffix: 'xl', quality: 75 }
    ];

    // Generate optimized versions
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `hero-pets-${size.suffix}.webp`);

      await sharp(inputPath)
        .resize(size.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: size.quality })
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      console.log(`Generated ${size.suffix}: ${size.width}px, ${(stats.size / 1024).toFixed(1)} KB`);
    }

    // Also generate a highly compressed version for mobile/small screens
    const mobileOutputPath = path.join(outputDir, 'hero-pets-mobile.webp');
    await sharp(inputPath)
      .resize(600, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: 70 })
      .toFile(mobileOutputPath);

    const mobileStats = await fs.stat(mobileOutputPath);
    console.log(`Generated mobile: 600px, ${(mobileStats.size / 1024).toFixed(1)} KB`);

    // Generate a compressed fallback JPG
    const fallbackOutputPath = path.join(outputDir, 'hero-pets-compressed.jpg');
    await sharp(inputPath)
      .resize(1200, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(fallbackOutputPath);

    const fallbackStats = await fs.stat(fallbackOutputPath);
    console.log(`Generated fallback JPG: 1200px, ${(fallbackStats.size / 1024).toFixed(1)} KB`);

  } catch (error) {
    console.error('Error optimizing hero image:', error);
  }
}

optimizeHeroImage();
