import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

async function verifyImages() {
  try {
    // Get all image files in public/images
    const imageFiles = await glob('public/images/*.{webp,png,jpg,jpeg,gif}');
    const imageSet = new Set(imageFiles.map(file => path.basename(file)));

    // Get all MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    const missingImages = new Set();

    // Regular expression to match MDXImage components
    const mdxImagePattern = /<MDXImage[^>]*src="\/images\/([^"]*)"[^>]*>/g;

    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      const filename = path.basename(file);
      let match;

      while ((match = mdxImagePattern.exec(content)) !== null) {
        const imageName = match[1];
        if (!imageSet.has(imageName)) {
          missingImages.add(imageName);
          console.log(`Missing image "${imageName}" referenced in ${filename}`);
        }
      }
    }

    if (missingImages.size > 0) {
      console.log(`\nFound ${missingImages.size} missing images:`);
      for (const image of missingImages) {
        console.log(`- ${image}`);
      }
    } else {
      console.log('\nAll images referenced in MDX files exist in the public/images directory!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyImages(); 