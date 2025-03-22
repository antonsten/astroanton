import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function fixFinalImageIssues() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    // Get all images in public/images directory
    const existingImages = await fs.readdir('public/images');
    
    // Create a set of image names without extensions
    const existingImageNames = new Set(existingImages.map(image => path.parse(image).name));
    
    // Regular expressions to match image paths in both Markdown and HTML formats
    const imageRegex = /!\[(.*?)\]\((.*?)\)|<img.*?src="(.*?)"[^>]*>/g;
    
    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      let newContent = content;
      let wasUpdated = false;
      
      // Replace all image references
      newContent = newContent.replace(imageRegex, (match, altText, mdPath, htmlPath) => {
        const imagePath = mdPath || htmlPath;
        if (!imagePath) return match;
        
        // Skip if it's already a valid /images/ path
        if (imagePath.startsWith('/images/')) {
          const baseName = path.parse(imagePath).name;
          if (existingImageNames.has(baseName)) {
            return match;
          }
        }
        
        // Remove the reference if it's an absolute URL or missing image
        wasUpdated = true;
        console.log(`Removing reference to missing image: ${imagePath} from ${file}`);
        return '';
      });
      
      // Write the updated content back to the file if changes were made
      if (wasUpdated) {
        await fs.writeFile(file, newContent, 'utf8');
        console.log(`✓ Updated ${file}`);
      }
    }
    
    console.log('Finished fixing final image issues');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixFinalImageIssues(); 