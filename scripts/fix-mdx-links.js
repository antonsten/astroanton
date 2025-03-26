import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing the MDX files
const articlesDir = path.join(__dirname, '../src/content/articles');

// Function to fix Jekyll-style link attributes
function fixJekyllLinks(content) {
  // Replace Jekyll-style link attributes with MDX/React-style
  let fixedContent = content;

  // Fix Jekyll-style target="_blank" links
  fixedContent = fixedContent.replace(
    /\[([^\]]+)\]\(([^)]+)\)\{:target="_blank"\}/g,
    (match, text, url) => `<a href="${url}" target="_blank">${text}</a>`
  );

  // Fix regular Markdown links
  fixedContent = fixedContent.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, url) => `<a href="${url}">${text}</a>`
  );

  // Fix malformed HTML links with quotes in attributes
  fixedContent = fixedContent.replace(
    /<a href="([^"]+)\s+"([^"]+)">/g,
    '<a href="$1">'
  );

  // Fix HTML entities
  fixedContent = fixedContent.replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'");

  // Fix Jekyll-style attributes on HTML links
  fixedContent = fixedContent.replace(
    /(<a[^>]+>.*?<\/a>)\{:target="_blank"\}/g,
    (match, link) => link.replace(/<a\s/, '<a target="_blank" ')
  );

  return fixedContent;
}

// Function to process a single file
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fixedContent = fixJekyllLinks(content);
  
  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`✅ Fixed: ${path.basename(filePath)}`);
  }
}

// Process all MDX files in the articles directory
fs.readdirSync(articlesDir)
  .filter(file => file.endsWith('.mdx'))
  .forEach(file => {
    const filePath = path.join(articlesDir, file);
    processFile(filePath);
  });

console.log('Link fixing complete!'); 