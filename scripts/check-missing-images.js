import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function checkMissingImages() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    // Get all images in public/images directory
    const existingImages = await fs.readdir('public/images');
    
    // Keep track of missing images
    const missingImages = new Set();
    
    // Regular expression to match image paths in both Markdown and HTML formats
    const imageRegex = /!\[.*?\]\(\/images\/([^)]+)\)|<img.*?src="\/images\/([^"]+)"/g;
    
    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      let match;
      
      while ((match = imageRegex.exec(content)) !== null) {
        const imageName = match[1] || match[2];
        if (!existingImages.includes(imageName)) {
          missingImages.add(imageName);
        }
      }
    }
    
    if (missingImages.size > 0) {
      console.log('Missing images:');
      for (const image of missingImages) {
        console.log(`- ${image}`);
      }
    } else {
      console.log('All images referenced in MDX files exist in public/images directory.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMissingImages(); 