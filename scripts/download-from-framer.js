import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import fetch from 'node-fetch';

const FRAMER_BASE_URL = 'https://framerusercontent.com/';
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'ico'];

async function downloadImage(url, targetPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    await fs.writeFile(targetPath, buffer);
    console.log(`✓ Downloaded: ${url}`);
    return true;
  } catch (error) {
    if (!error.message.includes('404')) {
      console.error(`✗ Failed to download ${url}:`, error.message);
    }
    return false;
  }
}

async function downloadFromFramer() {
  try {
    // Create images directory if it doesn't exist
    const targetDir = path.join(process.cwd(), 'public/images');
    await fs.mkdir(targetDir, { recursive: true });
    
    // Get list of existing images
    const existingImages = await fs.readdir(targetDir);
    const existingImageSet = new Set(existingImages);
    
    // Get list of missing images from our MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    const missingImages = new Set();
    const framerUrls = new Set();
    
    // Regular expressions to match image paths, including Framer URLs
    const imageRegex = /!\[.*?\]\((.*?)\)|<img.*?src="(.*?)"|https:\/\/framerusercontent\.com\/[^"\s\)]+/g;
    
    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      let match;
      
      while ((match = imageRegex.exec(content)) !== null) {
        const imagePath = match[1] || match[2] || match[0];
        if (imagePath) {
          if (imagePath.includes('framerusercontent.com')) {
            framerUrls.add(imagePath);
          } else {
            let filename = path.basename(imagePath).split('?')[0];
            const baseName = path.parse(filename).name;
            missingImages.add(baseName);
          }
        }
      }
    }

    // Download Framer images
    console.log('\nDownloading Framer images...');
    for (const url of framerUrls) {
      const filename = path.basename(url).split('?')[0];
      if (existingImageSet.has(filename)) continue;
      
      const targetPath = path.join(targetDir, filename);
      const success = await downloadImage(url, targetPath);
      if (success) {
        existingImageSet.add(filename);
      }
    }
    
    console.log('\nFinished checking Framer URLs');
    
    // List remaining missing images
    const remainingMissing = [...missingImages].filter(img => {
      return !EXTENSIONS.some(ext => existingImageSet.has(`${img}.${ext}`));
    });
    
    if (remainingMissing.length > 0) {
      console.log('\nStill missing images:');
      remainingMissing.forEach(img => console.log(`- ${img}`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

downloadFromFramer(); 