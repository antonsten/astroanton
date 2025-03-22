import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function fixAbsoluteImageUrls() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    // Get all images in public/images directory
    const existingImages = await fs.readdir('public/images');
    
    // Create a set of image names without extensions
    const existingImageNames = new Set(existingImages.map(image => path.parse(image).name));
    
    // Regular expression to match absolute image URLs in both Markdown and HTML formats
    const imageRegex = /!\[.*?\]\((https:\/\/www\.antonsten\.com\/content\/images\/[^)]+)\)|<img.*?src="(https:\/\/www\.antonsten\.com\/content\/images\/[^"]+)"[^>]*>/g;
    
    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      let newContent = content;
      let wasUpdated = false;
      
      // Replace absolute URLs with relative paths or remove if image doesn't exist
      newContent = newContent.replace(imageRegex, (match, mdPath, htmlPath) => {
        const url = mdPath || htmlPath;
        if (!url) return match;
        
        const filename = path.basename(url);
        const baseName = path.parse(filename).name;
        
        // Check if we have this image in any format
        if (existingImageNames.has(baseName)) {
          // Find the actual file with the correct extension
          const actualFile = existingImages.find(image => path.parse(image).name === baseName);
          wasUpdated = true;
          return match.replace(url, `/images/${actualFile}`);
        } else {
          // Image doesn't exist, remove the reference
          wasUpdated = true;
          console.log(`Removing reference to missing image: ${url} from ${file}`);
          return '';
        }
      });
      
      // Write the updated content back to the file if changes were made
      if (wasUpdated) {
        await fs.writeFile(file, newContent, 'utf8');
        console.log(`✓ Updated ${file}`);
      }
    }
    
    console.log('Finished fixing absolute image URLs');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAbsoluteImageUrls(); 