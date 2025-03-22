import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import sharp from 'sharp';

async function convertToWebP() {
  try {
    // Get all image files in public/images directory
    const imageFiles = await glob('public/images/*.*');
    
    for (const file of imageFiles) {
      // Skip if already WebP
      if (file.toLowerCase().endsWith('.webp')) {
        continue;
      }
      
      // Skip .ico files
      if (file.toLowerCase().endsWith('.ico')) {
        continue;
      }
      
      const outputFile = file.replace(/\.[^.]+$/, '.webp');
      console.log(`Converting ${file} to ${outputFile}`);
      
      try {
        await sharp(file)
          .webp({ quality: 80 })
          .toFile(outputFile);
        
        // Delete the original file
        await fs.unlink(file);
        console.log(`✓ Converted ${file} to WebP`);
      } catch (err) {
        console.error(`Error converting ${file}:`, err.message);
      }
    }
    
    console.log('Finished converting images to WebP');
  } catch (error) {
    console.error('Error:', error);
  }
}

convertToWebP(); 