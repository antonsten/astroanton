import fs from 'fs';
import { glob } from 'glob';

async function findNonWebPReferences() {
  // Get all MDX files
  const mdxFiles = await glob('src/content/**/*.{md,mdx}');
  
  // Regular expressions to match image references in different formats
  const patterns = [
    /!\[.*?\]\((.*?)\)/g,                           // Markdown image syntax ![alt](src)
    /src=["'](.*?)["']/g,                           // HTML/JSX src attribute
    /<MDXImage.*?src=["'](.*?)["']/g,               // MDXImage component
    /(?<=\/images\/[^"'\s]*)\.(jpe?g|png)(?=["'\s])/gi  // File extensions in image paths
  ];

  const issues = [];

  for (const mdxFile of mdxFiles) {
    const content = fs.readFileSync(mdxFile, 'utf8');
    let fileIssues = [];

    // Check each pattern
    for (const pattern of patterns) {
      const matches = [...content.matchAll(pattern)];
      
      for (const match of matches) {
        const imagePath = match[1] || match[0];
        // Skip if it's already a WebP or if it's an external URL
        if (!imagePath.match(/\.(jpe?g|png)$/i) || imagePath.startsWith('http')) continue;
        
        fileIssues.push(imagePath);
      }
    }

    if (fileIssues.length > 0) {
      issues.push({
        file: mdxFile,
        nonWebPReferences: [...new Set(fileIssues)] // Remove duplicates
      });
    }
  }

  return issues;
}

// Main function
async function main() {
  console.log('🔍 Checking MDX files for non-WebP image references...\n');
  
  const issues = await findNonWebPReferences();
  
  if (issues.length === 0) {
    console.log('✅ All image references are using WebP format!');
  } else {
    console.log('❌ Found non-WebP image references in the following files:\n');
    
    for (const {file, nonWebPReferences} of issues) {
      console.log(`📄 ${file}:`);
      for (const ref of nonWebPReferences) {
        console.log(`   - ${ref}`);
      }
      console.log('');
    }
  }
}

main().catch(console.error); 