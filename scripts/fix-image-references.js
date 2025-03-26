import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

const articlesDir = path.join(__dirname, '../src/content/articles');

// Function to update image references in a file
function updateImageReferences(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update image references that don't start with /images/articles/
  content = content.replace(
    /!\[(.*?)\]\(([^/].*?\.(jpg|png|gif|webp|jpeg))\)/g,
    (match, alt, path) => `![${alt}](/images/articles/${path})`
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated image references in ${path.basename(filePath)}`);
}

// Process all MDX files in the articles directory
fs.readdirSync(articlesDir)
  .filter(file => file.endsWith('.mdx'))
  .forEach(file => {
    const filePath = path.join(articlesDir, file);
    updateImageReferences(filePath);
  });

console.log('Finished updating image references in all articles.');

async function fixImageReferences() {
  // Get all MDX files
  const mdxFiles = await glob('src/content/**/*.{md,mdx}');
  
  // Regular expressions for different image reference formats
  const patterns = [
    {
      // Markdown image syntax: ![alt](/images/file.jpg)
      regex: /!\[([^\]]*)\]\(([^)]+)\.(jpe?g|png)\)/g,
      replace: (match, alt, path) => `![${alt}](${path}.webp)`
    },
    {
      // HTML img tag: <img src="/images/file.jpg" />
      regex: /<img[^>]*src=["']([^"']+)\.(jpe?g|png)["'][^>]*>/g,
      replace: (match, path) => match.replace(`${path}.jpg`, `${path}.webp`).replace(`${path}.jpeg`, `${path}.webp`).replace(`${path}.png`, `${path}.webp`)
    },
    {
      // MDXImage component: <MDXImage src="/images/file.jpg" />
      regex: /<MDXImage[^>]*src=["']([^"']+)\.(jpe?g|png)["'][^>]*>/g,
      replace: (match, path) => match.replace(`${path}.jpg`, `${path}.webp`).replace(`${path}.jpeg`, `${path}.webp`).replace(`${path}.png`, `${path}.webp`)
    },
    {
      // Simple path: /images/file.jpg
      regex: /(\/images\/[^"'\s]+)\.(jpe?g|png)(?=["'\s])/g,
      replace: (match, path) => `${path}.webp`
    }
  ];

  for (const mdxFile of mdxFiles) {
    let content = fs.readFileSync(mdxFile, 'utf8');
    const originalContent = content;
    
    // Apply each pattern
    for (const { regex, replace } of patterns) {
      content = content.replace(regex, replace);
    }
    
    // Handle escaped underscores
    content = content.replace(/\\+_/g, '_');
    
    if (content !== originalContent) {
      fs.writeFileSync(mdxFile, content, 'utf8');
      console.log(`📝 Updated references in ${mdxFile}`);
    }
  }
}

// Main function
async function main() {
  console.log('🔍 Fixing image references to use WebP format...\n');
  
  await fixImageReferences();
  
  console.log('\n✅ Completed updating image references!');
}

main().catch(console.error); 