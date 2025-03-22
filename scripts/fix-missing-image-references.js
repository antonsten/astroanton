import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function fixMissingImageReferences() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    // Get all images in public/images directory
    const existingImages = await fs.readdir('public/images');
    
    // Create a map of image names without extensions to their actual filenames
    const imageMap = new Map();
    for (const image of existingImages) {
      const baseName = path.parse(image).name;
      imageMap.set(baseName, image);
    }
    
    // Regular expression to match image paths in both Markdown and HTML formats
    const imageRegex = /!\[.*?\]\(\/images\/([^)]+)\)|<img.*?src="\/images\/([^"]+)"/g;
    
    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      let newContent = content;
      let wasUpdated = false;
      
      // Replace each image reference with the correct extension if available
      newContent = newContent.replace(imageRegex, (match, mdPath, htmlPath) => {
        const imagePath = mdPath || htmlPath;
        if (!imagePath) return match;
        
        const baseName = path.parse(imagePath).name;
        const actualImage = imageMap.get(baseName);
        
        if (actualImage && actualImage !== imagePath) {
          wasUpdated = true;
          return match.replace(imagePath, actualImage);
        }
        
        return match;
      });
      
      // Write the updated content back to the file if changes were made
      if (wasUpdated) {
        await fs.writeFile(file, newContent, 'utf8');
        console.log(`✓ Updated ${file}`);
      }
    }
    
    console.log('Finished updating image references');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixMissingImageReferences(); 