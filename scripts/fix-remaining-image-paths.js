import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function fixRemainingImagePaths() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    for (const file of mdxFiles) {
      console.log(`Processing ${file}...`);
      
      // Read file content
      let content = await fs.readFile(file, 'utf8');
      
      // Fix image paths
      content = content.replace(
        /!\[(.*?)\]\((https:\/\/www\.antonsten\.com\/content\/images\/[^)]+)\)|<img.*?src="(https:\/\/www\.antonsten\.com\/content\/images\/[^"]+)"/g,
        (match, alt, mdPath, htmlPath) => {
          const url = mdPath || htmlPath;
          if (!url) return match;
          
          // Get the filename from the URL
          const filename = path.basename(url);
          
          // Create the new path
          const newPath = `/images/${filename}`;
          
          return mdPath 
            ? `![${alt}](${newPath})`
            : match.replace(url, newPath);
        }
      );
      
      // Write the updated content back to the file
      await fs.writeFile(file, content, 'utf8');
      console.log(`✓ Updated ${file}`);
    }
    
    console.log('Finished updating image paths');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixRemainingImagePaths(); 