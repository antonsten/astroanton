import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function finalImageCleanup() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    // Get all images in public/images directory
    const existingImages = await fs.readdir('public/images');
    
    // Create a set of image names without extensions
    const existingImageNames = new Set(existingImages.map(image => path.parse(image).name));
    
    // Regular expressions to match different types of image references
    const patterns = [
      // Markdown image with alt text
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      // HTML img tag
      /<img[^>]*src="([^"]+)"[^>]*>/g,
      // Markdown image without alt text
      /!\[\]\(([^)]+)\)/g,
      // Bare image URLs
      /https?:\/\/[^\s)]+\.(png|jpe?g|gif|webp|ico)[^\s)]*/g
    ];
    
    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      let newContent = content;
      let wasUpdated = false;
      
      // Process each pattern
      for (const pattern of patterns) {
        newContent = newContent.replace(pattern, (match, ...args) => {
          // Extract the image path from the match
          let imagePath;
          if (pattern.toString().includes('src=')) {
            // HTML img tag
            imagePath = args[0];
          } else if (pattern.toString().includes('https?')) {
            // Bare URL
            imagePath = match;
          } else {
            // Markdown image
            imagePath = args[args.length - 2][1] || args[0];
          }
          
          if (!imagePath) return match;
          
          // Clean up the image path
          let filename = path.basename(imagePath);
          filename = filename.split('?')[0].split('#')[0];
          const baseName = path.parse(filename).name;
          
          // Check if the image exists in our public/images directory
          if (imagePath.startsWith('/images/') && existingImageNames.has(baseName)) {
            return match;
          }
          
          // Remove the reference if it's problematic
          wasUpdated = true;
          console.log(`Removing problematic image reference: ${imagePath} from ${file}`);
          return '';
        });
      }
      
      // Write the updated content back to the file if changes were made
      if (wasUpdated) {
        await fs.writeFile(file, newContent, 'utf8');
        console.log(`✓ Updated ${file}`);
      }
    }
    
    console.log('Finished final image cleanup');
  } catch (error) {
    console.error('Error:', error);
  }
}

finalImageCleanup(); 