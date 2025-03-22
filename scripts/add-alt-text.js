import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

function cleanText(text) {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Replace markdown links with link text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '') // Remove markdown images
    .replace(/\{[^}]*\}/g, '') // Remove curly brace content
    .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\d+/g, '') // Remove numbers
    .trim();
}

function generateAltText(filename, context) {
  // Remove file extension and convert to readable text
  const name = path.basename(filename, path.extname(filename))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\d+/g, '') // Remove numbers
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Clean up context
  const cleanContext = cleanText(context);
  
  // Get the first sentence of context, limited to 50 characters at word boundaries
  const contextSentence = cleanContext.split(/[.!?]+/)[0].trim();
  let truncatedContext = contextSentence;
  if (contextSentence.length > 50) {
    // Find the last space before 50 characters
    const lastSpace = contextSentence.substring(0, 50).lastIndexOf(' ');
    truncatedContext = contextSentence.substring(0, lastSpace) + '...';
  }
  
  if (truncatedContext) {
    return `${truncatedContext} - ${name}`;
  }
  
  return name;
}

async function addAltText() {
  try {
    const mdxFiles = await glob('src/content/articles/*.mdx');
    let totalUpdated = 0;

    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      const filename = path.basename(file);
      let updatedContent = content;

      // Regular expression to match MDXImage components
      const mdxImagePattern = /<MDXImage[^>]*src="\/images\/([^"]*)"[^>]*>/g;
      const matches = Array.from(content.matchAll(mdxImagePattern));

      // Process matches in reverse order to avoid position issues
      for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const fullMatch = match[0];
        const imageName = match[1];
        
        // Get context (50 characters before and after the image)
        const start = Math.max(0, match.index - 50);
        const end = Math.min(content.length, match.index + fullMatch.length + 50);
        const context = content.substring(start, end);

        // Generate alt text
        const altText = generateAltText(imageName, context);

        // Create new MDXImage component with alt text
        let newComponent = fullMatch;
        if (fullMatch.includes('alt="')) {
          newComponent = fullMatch.replace(/alt="[^"]*"/, `alt="${altText}"`);
        } else {
          newComponent = fullMatch.replace(/>$/, ` alt="${altText}" />`);
        }

        // Replace the old component with the new one
        updatedContent = updatedContent.substring(0, match.index) + 
                        newComponent + 
                        updatedContent.substring(match.index + fullMatch.length);

        console.log(`Updated image in ${filename}:`);
        console.log(`- Image: ${imageName}`);
        console.log(`- Alt text: ${altText}`);
        console.log('');

        totalUpdated++;
      }

      // Write the updated content back to the file
      if (updatedContent !== content) {
        await fs.writeFile(file, updatedContent, 'utf8');
        console.log(`Updated ${filename}`);
      }
    }

    console.log(`\nTotal images updated: ${totalUpdated}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

addAltText(); 