import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

async function aggressiveCleanup() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    // Get existing images from public/images
    const existingImages = await fs.readdir('public/images');
    const imageSet = new Set(existingImages.map(img => path.parse(img).name.toLowerCase()));

    // Define patterns to match and remove
    const patterns = [
      // Markdown images with any URL or path
      /!\[([^\]]*)\]\([^)]+\)/g,
      
      // HTML img tags with any URL or path
      /<img[^>]*src=["'][^"']+["'][^>]*>/g,
      
      // Bare image URLs or filenames
      /(?:https?:\/\/[^\s"')]+\.(?:jpg|jpeg|png|gif|webp|ico)|(?:^|\s)[^\/\s]+\.(?:jpg|jpeg|png|gif|webp|ico))(?=[\s"')]|$)/gi,
      
      // Any remaining image-like URLs
      /https?:\/\/(?:www\.)?antonsten\.com\/content\/images\/[^\s"')]+/g,
      
      // Any remaining image filenames
      /(?:^|\s)(?:[^\/\s]+\.(?:jpg|jpeg|png|gif|webp|ico))(?=[\s"')]|$)/gi,
      
      // Any remaining image references in markdown
      /!\[([^\]]*)\]\([^)]+\)/g,
      
      // Any remaining image references in HTML
      /<img[^>]*src=["'][^"']+["'][^>]*>/g,
      
      // Any remaining image references in URLs
      /https?:\/\/[^\s"')]+\.(?:jpg|jpeg|png|gif|webp|ico)/g,
      
      // Any remaining image references in filenames
      /(?:^|\s)[^\/\s]+\.(?:jpg|jpeg|png|gif|webp|ico)(?=[\s"')]|$)/gi,
      
      // Any remaining image references in paths
      /(?:^|\s)[^\/\s]+\/[^\/\s]+\.(?:jpg|jpeg|png|gif|webp|ico)(?=[\s"')]|$)/gi,
      
      // Any remaining image references in URLs with paths
      /https?:\/\/[^\s"')]+\/[^\s"')]+\.(?:jpg|jpeg|png|gif|webp|ico)/g
    ];

    for (const file of mdxFiles) {
      let content = await fs.readFile(file, 'utf8');
      let originalContent = content;
      
      // Apply each pattern
      for (const pattern of patterns) {
        content = content.replace(pattern, '');
      }
      
      // Clean up artifacts
      content = content
        // Remove empty markdown image references
        .replace(/!\[\]\(\)/g, '')
        // Remove empty HTML img tags
        .replace(/<img[^>]*>\s*/g, '')
        // Remove empty paragraphs
        .replace(/^\s*[\r\n]/gm, '')
        // Remove multiple consecutive empty lines
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Remove lines that only contain spaces
        .replace(/^\s+$/gm, '')
        // Remove any remaining empty HTML tags
        .replace(/<[^>]*>\s*<\/[^>]*>/g, '')
        // Remove any remaining empty markdown links
        .replace(/\[\]\(\)/g, '')
        // Remove any remaining empty markdown images
        .replace(/!\[\]\(\)/g, '')
        // Remove any remaining empty HTML img tags
        .replace(/<img[^>]*>\s*/g, '')
        // Remove any remaining empty paragraphs
        .replace(/^\s*[\r\n]/gm, '')
        // Remove any remaining multiple consecutive empty lines
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Remove any remaining lines that only contain spaces
        .replace(/^\s+$/gm, '')
        // Remove any remaining empty HTML tags
        .replace(/<[^>]*>\s*<\/[^>]*>/g, '')
        // Remove any remaining empty markdown links
        .replace(/\[\]\(\)/g, '');
      
      // Only write if changes were made
      if (content !== originalContent) {
        await fs.writeFile(file, content, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
    
    console.log('Finished aggressive cleanup');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

aggressiveCleanup(); 