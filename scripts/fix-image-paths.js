import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { promisify } from 'util';

const globPromise = promisify(glob);

async function fixImagePaths() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    for (const file of mdxFiles) {
      console.log(`Processing ${file}...`);
      
      // Read file content
      let content = await fs.readFile(file, 'utf8');
      
      // Fix image paths
      content = content.replace(
        /!\[(.*?)\]\((.*?)\)|<img.*?src="(.*?)"/g,
        (match, alt, mdPath, htmlPath) => {
          const imgPath = mdPath || htmlPath;
          if (!imgPath) return match;
          
          // Skip if it's already an absolute URL
          if (imgPath.startsWith('http')) return match;
          
          // Get the filename from the path
          const filename = path.basename(imgPath);
          
          // Create the new path
          const newPath = `/images/${filename}`;
          
          return mdPath 
            ? `![${alt}](${newPath})`
            : match.replace(imgPath, newPath);
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

fixImagePaths(); 