import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function fixAbsoluteUrls() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    for (const file of mdxFiles) {
      console.log(`Processing ${file}...`);
      
      // Read file content
      let content = await fs.readFile(file, 'utf8');
      let wasUpdated = false;
      
      // Fix image paths
      const newContent = content.replace(
        /!\[(.*?)\]\((https:\/\/www\.antonsten\.com\/content\/images\/[^)]+)\)|<img.*?src="(https:\/\/www\.antonsten\.com\/content\/images\/[^"]+)"/g,
        (match, alt, mdPath, htmlPath) => {
          const url = mdPath || htmlPath;
          if (!url) return match;
          
          // Get the filename from the URL
          const filename = path.basename(url);
          
          // Create the new path
          const newPath = `/images/${filename}`;
          
          wasUpdated = true;
          return alt ? `![${alt}](${newPath})` : match.replace(url, newPath);
        }
      );
      
      if (newContent !== content) {
        // Write the updated content back to the file
        await fs.writeFile(file, newContent, 'utf8');
        console.log(`✓ Updated ${file}`);
      }
    }
    
    console.log('Finished updating absolute URLs');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAbsoluteUrls(); 