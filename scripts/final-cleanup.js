import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function finalCleanup() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    // Get all images in public/images directory
    const existingImages = await fs.readdir('public/images');
    
    // Create a set of image names without extensions
    const existingImageNames = new Set(existingImages.map(image => path.parse(image).name));
    
    // Regular expressions to match problematic patterns
    const patterns = [
      // Absolute URLs to antonsten.com
      /https:\/\/www\.antonsten\.com\/content\/images\/[^\s)]+/g,
      
      // Relative image paths without /images/ prefix
      /!\[[^\]]*\]\((?!\/images\/)[^)]+\.(png|jpe?g|gif|webp|ico)\)/g,
      
      // HTML img tags with absolute URLs
      /<img[^>]*src="https:\/\/[^"]+\.(png|jpe?g|gif|webp|ico)"[^>]*>/g,
      
      // HTML img tags with relative paths without /images/ prefix
      /<img[^>]*src="(?!\/images\/)[^"]+\.(png|jpe?g|gif|webp|ico)"[^>]*>/g,
      
      // Bare filenames
      /(?<![/"'])([\w-]+\.(png|jpe?g|gif|webp|ico))(?![/"'])/g
    ];
    
    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      let newContent = content;
      let wasUpdated = false;
      
      // Process each pattern
      for (const pattern of patterns) {
        const matches = newContent.match(pattern);
        if (matches) {
          wasUpdated = true;
          matches.forEach(match => {
            console.log(`Removing problematic pattern: ${match} from ${file}`);
          });
          newContent = newContent.replace(pattern, '');
        }
      }
      
      // Clean up any artifacts
      newContent = newContent
        .replace(/!\[\]\(\)/g, '') // Remove empty image references
        .replace(/<img[^>]*src=""[^>]*>/g, '') // Remove img tags with empty src
        .replace(/\n{3,}/g, '\n\n') // Replace 3+ consecutive newlines with 2
        .replace(/\s*<p>\s*<\/p>\s*/g, '\n') // Remove empty paragraphs
        .trim();
      
      // Write the updated content back to the file if changes were made
      if (wasUpdated) {
        await fs.writeFile(file, newContent, 'utf8');
        console.log(`✓ Updated ${file}`);
      }
    }
    
    console.log('Finished final cleanup');
  } catch (error) {
    console.error('Error:', error);
  }
}

finalCleanup(); 