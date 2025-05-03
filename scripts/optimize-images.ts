import { optimizeImage, generateResponsiveImages } from '../src/utils/imageOptimization.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import process from 'process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Get the file path argument if provided
const fileArg = process.argv[2];

async function processDirectory(directory: string) {
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

async function main() {
  if (fileArg) {
    // Optimize only the specified file
    const ext = path.extname(fileArg).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
      let relativePath = path.relative(rootDir, fileArg);
      if (relativePath.startsWith('public/')) {
        relativePath = relativePath.replace(/^public[\/]/, '');
      }
      const outputDir = path.join(rootDir, 'public/optimized', path.dirname(relativePath));
      const baseName = path.basename(fileArg, ext);
      await generateResponsiveImages(fileArg, outputDir, baseName);
      console.log(`Optimized single file: ${fileArg}`);
    } else {
      console.warn(`Unsupported file type: ${fileArg}`);
    }
  } else {
    // Process all images as before
    await processDirectory(path.join(rootDir, 'public/images'));
  }
}

main();
// Only process all images if no file argument is provided
if (!fileArg) {
  const publicDir = path.join(rootDir, 'public');
  console.log('Starting image optimization...');
  processDirectory(publicDir)
    .then(() => console.log('Image optimization complete!'))
    .catch(console.error);
} 