import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import fetch from 'node-fetch';

async function downloadImage(url, targetPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    
    const buffer = await response.buffer();
    await fs.writeFile(targetPath, buffer);
    console.log(`✓ Downloaded: ${url}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to download ${url}:`, error.message);
    return false;
  }
}

async function downloadMissingImages() {
  try {
    // Create images directory if it doesn't exist
    const targetDir = path.join(process.cwd(), 'public/images');
    await fs.mkdir(targetDir, { recursive: true });
    
    // Get list of missing images from our MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    const missingImages = new Set();
    
    // Regular expression to match image paths
    const imageRegex = /!\[.*?\]\((.*?)\)|<img.*?src="(.*?)"/g;
    
    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      let match;
      
      while ((match = imageRegex.exec(content)) !== null) {
        const imagePath = match[1] || match[2];
        if (imagePath) {
          missingImages.add(imagePath);
        }
      }
    }
    
    // Get existing images in our project
    const existingImages = await fs.readdir(targetDir);
    const existingImageSet = new Set(existingImages);
    
    // Download missing images
    for (const imageUrl of missingImages) {
      // Skip if it's already a local image
      if (imageUrl.startsWith('/images/')) {
        const filename = path.basename(imageUrl);
        if (!existingImageSet.has(filename)) {
          console.log(`Missing local image: ${filename}`);
        }
        continue;
      }
      
      // Skip if it's not an antonsten.com URL
      if (!imageUrl.includes('antonsten.com')) {
        console.log(`Skipping non-antonsten.com URL: ${imageUrl}`);
        continue;
      }
      
      const filename = path.basename(imageUrl);
      const targetPath = path.join(targetDir, filename);
      
      if (!existingImageSet.has(filename)) {
        await downloadImage(imageUrl, targetPath);
      }
    }
    
    console.log('Finished downloading missing images');
  } catch (error) {
    console.error('Error:', error);
  }
}

downloadMissingImages(); 