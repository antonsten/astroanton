import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function ultimateImageCleanup() {
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
      {
        pattern: /!\[([^\]]*)\]\(([^)]+)\)/g,
        extract: (match, alt, src) => ({ src, alt })
      },
      // HTML img tag
      {
        pattern: /<img[^>]*src="([^"]+)"[^>]*>/g,
        extract: (match, src) => ({ src })
      },
      // Bare URLs
      {
        pattern: /https?:\/\/[^\s)]+\.(png|jpe?g|gif|webp|ico)[^\s)]*/g,
        extract: (match) => ({ src: match })
      }
    ];
    
    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      let newContent = content;
      let wasUpdated = false;
      
      // Process each pattern
      for (const { pattern, extract } of patterns) {
        newContent = newContent.replace(pattern, (...args) => {
          const { src, alt = '' } = extract(...args);
          
          // Skip if it's already a valid /images/ path
          if (src.startsWith('/images/')) {
            const baseName = path.parse(src).name;
            if (existingImageNames.has(baseName)) {
              return args[0]; // Return original match
            }
          }
          
          // Remove the reference
          wasUpdated = true;
          console.log(`Removing image reference: ${src} from ${file}`);
          return '';
        });
      }
      
      // Clean up any empty lines or multiple consecutive newlines
      newContent = newContent
        .replace(/\n{3,}/g, '\n\n') // Replace 3+ consecutive newlines with 2
        .replace(/!\[\]\(\)/g, '') // Remove empty image references
        .replace(/<img[^>]*src=""[^>]*>/g, '') // Remove img tags with empty src
        .replace(/\s*<p>\s*<\/p>\s*/g, '\n') // Remove empty paragraphs
        .trim();
      
      // Write the updated content back to the file if changes were made
      if (wasUpdated) {
        await fs.writeFile(file, newContent, 'utf8');
        console.log(`✓ Updated ${file}`);
      }
    }
    
    console.log('Finished ultimate image cleanup');
  } catch (error) {
    console.error('Error:', error);
  }
}

ultimateImageCleanup(); 