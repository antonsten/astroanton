import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const relativeImages = {
  'filters.png': '/images/filters.png',
  'uxpath2.png': '/images/uxpath2.png',
  'ipod_classic.jpg': '/images/ipod_classic.jpg',
  'uxpath.jpeg': '/images/uxpath.jpeg',
  'aimforthis.001.jpeg': '/images/aimforthis.001.jpeg',
  'tweets.jpg.001.jpeg': '/images/tweets.jpg.001.jpeg',
  'pyramid_of_ux.png': '/images/pyramid_of_ux.png',
  'logo_01.png': '/images/logo_01.png',
  'logo_02.png': '/images/logo_02.png',
  'logo_03.png': '/images/logo_03.png',
  'userexperience-chart2-1024x576.png': '/images/userexperience-chart2-1024x576.png',
  'martone.jpg': '/images/martone.jpg',
  'computer-skill-levels-by-country.png': '/images/computer-skill-levels-by-country.png',
  'designsystems1011.png': '/images/designsystems1011.png',
  'designsystems1012.png': '/images/designsystems1012.png',
  'process2.png': '/images/process2.png',
  'lofi-wireframe.jpg': '/images/lofi-wireframe.jpg',
  'mid-wireframe.jpg': '/images/mid-wireframe.jpg',
  'hifi-wireframe.jpg': '/images/hifi-wireframe.jpg',
  'ethics2.png': '/images/ethics2.png',
  'Screen-Shot-2017-03-05-at-18.56.33.png': '/images/Screen-Shot-2017-03-05-at-18.56.33.png',
  'anton-taylor.jpeg': '/images/anton-taylor.jpeg',
  'zoom-ueno.png': '/images/zoom-ueno.png',
  'anton-tattoo.jpeg': '/images/anton-tattoo.jpeg'
};

async function fixRelativeImagePaths() {
  try {
    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    
    for (const file of mdxFiles) {
      console.log(`Processing ${file}...`);
      
      // Read file content
      let content = await fs.readFile(file, 'utf8');
      let wasUpdated = false;
      
      // Fix image paths
      for (const [oldPath, newPath] of Object.entries(relativeImages)) {
        const regex = new RegExp(`!\\[(.*?)\\]\\(${oldPath}\\)|<img.*?src="${oldPath}"`, 'g');
        const newContent = content.replace(regex, (match, alt) => {
          wasUpdated = true;
          return alt ? `![${alt}](${newPath})` : match.replace(oldPath, newPath);
        });
        
        if (newContent !== content) {
          content = newContent;
        }
      }
      
      if (wasUpdated) {
        // Write the updated content back to the file
        await fs.writeFile(file, content, 'utf8');
        console.log(`✓ Updated ${file}`);
      }
    }
    
    console.log('Finished updating relative image paths');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixRelativeImagePaths(); 