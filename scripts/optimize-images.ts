import { optimizeImage, generateResponsiveImages } from '../src/utils/imageOptimization.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function processDirectory(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        const relativePath = path.relative(rootDir, fullPath);
        const outputDir = path.join(rootDir, 'public', 'optimized', path.dirname(relativePath));
        const baseName = path.basename(entry.name, ext);
        
        console.log(`Processing ${relativePath}...`);
        
        try {
          // Generate responsive images
          const optimizedImages = await generateResponsiveImages(
            fullPath,
            outputDir,
            baseName
          );
          
          console.log(`Generated optimized versions for ${relativePath}`);
        } catch (error) {
          console.error(`Error processing ${relativePath}:`, error);
        }
      }
    }
  }
}

// Process images in public directory
const publicDir = path.join(rootDir, 'public');
console.log('Starting image optimization...');
processDirectory(publicDir)
  .then(() => console.log('Image optimization complete!'))
  .catch(console.error); 