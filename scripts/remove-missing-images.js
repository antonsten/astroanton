import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function removeMissingImages() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    // Get all images in public/images directory
    const existingImages = await fs.readdir('public/images');
    
    // Create a set of image names without extensions
    const existingImageNames = new Set(existingImages.map(image => path.parse(image).name));
    
    // Regular expression to match image paths in both Markdown and HTML formats
    const imageRegex = /!\[.*?\]\(\/images\/([^)]+)\)|<img.*?src="\/images\/([^"]+)"[^>]*>/g;
    
    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      let newContent = content;
      let wasUpdated = false;
      
      // Remove references to missing images
      newContent = newContent.replace(imageRegex, (match, mdPath, htmlPath) => {
        const imagePath = mdPath || htmlPath;
        if (!imagePath) return match;
        
        const baseName = path.parse(imagePath).name;
        
        if (!existingImageNames.has(baseName)) {
          wasUpdated = true;
          console.log(`Removing reference to missing image: ${imagePath} from ${file}`);
          return '';
        }
        
        return match;
      });
      
      // Write the updated content back to the file if changes were made
      if (wasUpdated) {
        await fs.writeFile(file, newContent, 'utf8');
        console.log(`✓ Updated ${file}`);
      }
    }
    
    console.log('Finished removing missing image references');
  } catch (error) {
    console.error('Error:', error);
  }
}

removeMissingImages(); 