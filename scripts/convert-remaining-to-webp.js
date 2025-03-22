import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to convert image to WebP
async function convertToWebP(inputPath) {
  const outputPath = inputPath.replace(/\.(jpe?g|png)$/i, '.webp');
  
  try {
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
    
    console.log(`✅ Converted ${path.basename(inputPath)} to WebP`);
    return outputPath;
  } catch (error) {
    console.error(`❌ Error converting ${path.basename(inputPath)}:`, error);
    return null;
  }
}

// Function to update image references in MDX files
async function updateMDXReferences(oldPath, newPath) {
  const mdxFiles = await glob('src/content/**/*.{md,mdx}');
  const oldFilename = path.basename(oldPath);
  const newFilename = path.basename(newPath);
  
  // Get the relative path from public directory
  const oldRelativePath = oldPath.replace('public', '');
  const newRelativePath = newPath.replace('public', '');
  
  for (const mdxFile of mdxFiles) {
    let content = fs.readFileSync(mdxFile, 'utf8');
    const originalContent = content;
    
    // Update references in various formats
    content = content
      // Update full paths
      .replace(
        new RegExp(oldRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        newRelativePath
      )
      // Update just filenames (fallback)
      .replace(
        new RegExp(oldFilename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        newFilename
      );
    
    if (content !== originalContent) {
      fs.writeFileSync(mdxFile, content, 'utf8');
      console.log(`📝 Updated references in ${mdxFile}`);
    }
  }
}

// Main function
async function main() {
  // Find all non-WebP images
  const images = await glob('public/images/**/*.{jpg,jpeg,png}', {
    ignore: ['**/node_modules/**']
  });
  
  console.log(`Found ${images.length} non-WebP images to convert`);
  
  for (const imagePath of images) {
    const webpPath = await convertToWebP(imagePath);
    if (webpPath) {
      await updateMDXReferences(imagePath, webpPath);
      
      // Delete original file after successful conversion and reference updates
      fs.unlinkSync(imagePath);
      console.log(`🗑️  Deleted original file: ${path.basename(imagePath)}`);
    }
  }
}

main().catch(console.error); 