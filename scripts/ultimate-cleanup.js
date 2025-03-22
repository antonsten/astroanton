import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

async function ultimateCleanup() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    // Read existing images from public/images directory
    const existingImages = await fs.readdir('public/images');
    const existingImageNames = new Set(existingImages.map(img => path.parse(img).name));
    
    // Define patterns to match and remove
    const patterns = [
      // Markdown images with absolute URLs (all file types)
      /!\[.*?\]\(https:\/\/www\.antonsten\.com\/content\/images\/.*?\.(jpg|jpeg|png|gif|webp|ico)\)/g,
      // Markdown images with relative paths (all file types)
      /!\[.*?\]\(.*?\.(jpg|jpeg|png|gif|webp|ico)\)/g,
      // HTML img tags with absolute URLs (all file types)
      /<img.*?src="https:\/\/www\.antonsten\.com\/content\/images\/.*?\.(jpg|jpeg|png|gif|webp|ico)".*?>/g,
      // HTML img tags with relative paths (all file types)
      /<img.*?src=".*?\.(jpg|jpeg|png|gif|webp|ico)".*?>/g,
      // Bare image URLs (all file types)
      /https:\/\/www\.antonsten\.com\/content\/images\/.*?\.(jpg|jpeg|png|gif|webp|ico)/g,
      // Bare filenames (all file types)
      /\b[\w-]+\.(jpg|jpeg|png|gif|webp|ico)\b/g,
      // Markdown images with absolute URLs (specific directories)
      /!\[.*?\]\(https:\/\/www\.antonsten\.com\/content\/images\/(2024|2025)\/\d+\/.*?\)/g,
      // HTML img tags with absolute URLs (specific directories)
      /<img.*?src="https:\/\/www\.antonsten\.com\/content\/images\/(2024|2025)\/\d+\/.*?".*?>/g,
      // Bare image URLs (specific directories)
      /https:\/\/www\.antonsten\.com\/content\/images\/(2024|2025)\/\d+\/.*?\.(jpg|jpeg|png|gif|webp|ico)/g,
      // Markdown images with absolute URLs (icon directory)
      /!\[.*?\]\(https:\/\/www\.antonsten\.com\/content\/images\/icon\/.*?\)/g,
      // HTML img tags with absolute URLs (icon directory)
      /<img.*?src="https:\/\/www\.antonsten\.com\/content\/images\/icon\/.*?".*?>/g,
      // Bare image URLs (icon directory)
      /https:\/\/www\.antonsten\.com\/content\/images\/icon\/.*?\.(jpg|jpeg|png|gif|webp|ico)/g,
      // Markdown images with absolute URLs (no extension)
      /!\[.*?\]\(https:\/\/www\.antonsten\.com\/content\/images\/.*?[^\.]\)/g,
      // HTML img tags with absolute URLs (no extension)
      /<img.*?src="https:\/\/www\.antonsten\.com\/content\/images\/.*?[^\."].*?>/g,
      // Bare image URLs (no extension)
      /https:\/\/www\.antonsten\.com\/content\/images\/.*?[^\."\s)]/g
    ];
    
    // Process each MDX file
    for (const file of mdxFiles) {
      console.log(`Processing ${file}...`);
      let content = await fs.readFile(file, 'utf8');
      let modified = false;
      
      // Apply each pattern
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`Found ${matches.length} matches in ${file}`);
          content = content.replace(pattern, '');
          modified = true;
        }
      }
      
      // Clean up any artifacts
      content = content
        .replace(/\[\s*\]\(\)/g, '') // Remove empty image references
        .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
        .replace(/<img[^>]*>\s*<\/img>/g, '') // Remove empty img tags with closing tag
        .replace(/<img[^>]*\/>/g, '') // Remove self-closing img tags
        .replace(/<img[^>]*>/g, '') // Remove img tags without closing
        .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
        .replace(/^\s+|\s+$/g, '') // Trim whitespace
        .replace(/!\[\s*\]\(\s*\)/g, '') // Remove empty markdown images
        .replace(/!\[\s*\]\(\s*[^\)]*\)/g, '') // Remove markdown images with empty alt text
        .replace(/\[\s*\]\(\s*[^\)]*\)/g, '') // Remove empty markdown links
        .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs again after other cleanups
        .trim();
      
      if (modified) {
        await fs.writeFile(file, content, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
    
    console.log('Finished ultimate cleanup');
  } catch (error) {
    console.error('Error during ultimate cleanup:', error);
  }
}

ultimateCleanup(); 