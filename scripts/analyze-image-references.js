import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

async function analyzeImageReferences() {
  try {
    const mdxFiles = await glob('src/content/articles/*.mdx');
    const imageReferences = new Map();
    
    // Regular expressions to match different types of image references
    const patterns = {
      mdxImage: /<MDXImage[^>]*src="([^"]*)"[^>]*width={(\d+)}[^>]*height={(\d+)}[^>]*>/g,
      markdown: /!\[(.*?)\]\((.*?)\)/g,
      html: /<img[^>]*src="([^"]*)"[^>]*>/g,
      framer: /https:\/\/framerusercontent\.com\/[^"\s\)]+/g,
      cloudinary: /https:\/\/res\.cloudinary\.com\/[^"\s\)]+/g,
      other: /https?:\/\/[^"\s\)]+\.(jpg|jpeg|png|gif|webp|ico)/g
    };

    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      const filename = path.basename(file);
      
      for (const [type, pattern] of Object.entries(patterns)) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const reference = match[0];
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          if (!imageReferences.has(reference)) {
            imageReferences.set(reference, {
              type,
              reference,
              files: new Set(),
              lineNumbers: new Set()
            });
          }
          
          const ref = imageReferences.get(reference);
          ref.files.add(filename);
          ref.lineNumbers.add(lineNumber);
        }
      }
    }

    // Print analysis
    console.log('\nImage Reference Analysis:');
    console.log('=======================\n');

    const categories = {
      mdxImage: [],
      markdown: [],
      html: [],
      framer: [],
      cloudinary: [],
      other: []
    };

    for (const [reference, data] of imageReferences) {
      categories[data.type].push({
        reference,
        files: Array.from(data.files),
        lineNumbers: Array.from(data.lineNumbers)
      });
    }

    for (const [category, refs] of Object.entries(categories)) {
      if (refs.length > 0) {
        console.log(`\n${category.toUpperCase()} References (${refs.length}):`);
        refs.forEach(ref => {
          console.log(`\nReference: ${ref.reference}`);
          console.log(`Files: ${ref.files.join(', ')}`);
          console.log(`Line numbers: ${ref.lineNumbers.join(', ')}`);
        });
      }
    }

    // Summary
    console.log('\nSummary:');
    console.log('========');
    for (const [category, refs] of Object.entries(categories)) {
      console.log(`${category}: ${refs.length} references`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeImageReferences(); 