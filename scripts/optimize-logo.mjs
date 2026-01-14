import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const inputPath = 'src/assets/logo.png';
const outputPath = 'src/assets/logo.webp';

async function optimizeLogo() {
  try {
    // Check if input file exists
    await fs.access(inputPath);

    // Get original dimensions
    const metadata = await sharp(inputPath).metadata();
    console.log(`Original logo: ${metadata.width}x${metadata.height}, ${metadata.format}`);

    // Compress to WebP with quality 80, resize if too large
    let pipeline = sharp(inputPath).webp({ quality: 80 });

    // If width > 400px, resize down to 400px width maintaining aspect ratio
    if (metadata.width > 400) {
      pipeline = pipeline.resize(400, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // Write optimized version
    await pipeline.toFile(outputPath);

    // Get new file size
    const newMetadata = await sharp(outputPath).metadata();
    const stats = await fs.stat(outputPath);

    console.log(`Optimized logo: ${newMetadata.width}x${newMetadata.height}, ${newMetadata.format}`);
    console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);

    // Remove original if optimization successful and much smaller
    if (stats.size < 50000) { // Less than 50KB
      await fs.unlink(inputPath);
      console.log('Removed original logo.png');
    }

  } catch (error) {
    console.error('Error optimizing logo:', error);
  }
}

optimizeLogo();
