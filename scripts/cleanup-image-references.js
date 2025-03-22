import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function cleanupImageReferences() {
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
        
        // Extract the filename from the path
        let filename = path.basename(imagePath);
        
        // Remove any query parameters or hash fragments
        filename = filename.split('?')[0].split('#')[0];
        
        // Remove any file extension
        const baseName = path.parse(filename).name;
        
        // Check if the image exists
        if (existingImageNames.has(baseName)) {
          // If it exists, update the path to use /images/
          wasUpdated = true;
          return `![${altText || ''}](/images/${baseName})`;
        }
        
        // If the image doesn't exist, remove the reference
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
    
    console.log('Finished cleaning up image references');
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupImageReferences(); 