import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TurndownService from 'turndown';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Initialize Turndown for HTML to Markdown conversion
const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

// Customize Turndown to handle figure/figcaption
turndown.addRule('figure', {
  filter: ['figure'],
  replacement: function(content) {
    return content;
  }
});

// Read and parse the Ghost export file
const ghostData = JSON.parse(fs.readFileSync(path.join(rootDir, 'posts.json'), 'utf8'));
const posts = ghostData.db[0].data.posts;

// Create content directory if it doesn't exist
const contentDir = path.join(rootDir, 'src', 'content', 'posts');
fs.mkdirSync(contentDir, { recursive: true });

// Track missing images
const missingImages = new Set();

// Function to clean up content and collect missing images
function processContent(content) {
  // Fix Ghost URLs in links
  content = content.replace(/__GHOST_URL__\/articles\//g, '/posts/');
  content = content.replace(/__GHOST_URL__\//g, '/');

  // Track and replace image tags
  content = content.replace(
    /<figure[^>]*>.*?<img[^>]*src="[^"]*\/images\/([^"]+)"[^>]*>.*?<\/figure>/g,
    (match, imagePath) => {
      missingImages.add(imagePath);
      return `\n\n![Missing Image: ${imagePath}]\n\n`;
    }
  );

  // Handle standalone image tags
  content = content.replace(
    /<img[^>]*src="[^"]*\/images\/([^"]+)"[^>]*>/g,
    (match, imagePath) => {
      missingImages.add(imagePath);
      return `![Missing Image: ${imagePath}]`;
    }
  );

  // Clean up any empty figure tags
  content = content.replace(/<figure[^>]*>(\s|&nbsp;)*<\/figure>/g, '');

  // Convert HTML to Markdown
  let markdown = turndown.turndown(content);

  // Clean up extra newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown;
}

// Process each post
posts.forEach(post => {
  // Skip drafts and pages
  if (post.status !== 'published' || post.type === 'page') {
    return;
  }

  // Create frontmatter
  const frontmatter = {
    title: post.title,
    slug: post.slug,
    publishDate: post.published_at,
    updatedDate: post.updated_at,
    tags: [], // We'll need to process tags separately if needed
    featured: post.featured === 1,
  };

  // Process the content
  const content = processContent(post.html);

  // Create the markdown file content
  const fileContent = `---
${Object.entries(frontmatter)
  .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
  .join('\n')}
---

${content}
`;

  // Write the file
  const fileName = `${post.slug}.md`;
  fs.writeFileSync(path.join(contentDir, fileName), fileContent);
  console.log(`Imported: ${post.title}`);
});

// Write missing images report
const missingImagesReport = Array.from(missingImages)
  .sort()
  .map(img => `- ${img}`)
  .join('\n');

fs.writeFileSync(
  path.join(rootDir, 'missing-images.md'),
  `# Missing Images Report\n\nThe following ${missingImages.size} images need to be restored:\n\n${missingImagesReport}\n`
);

console.log(`\nPosts imported successfully! Found ${missingImages.size} missing images.`);
console.log('Check missing-images.md for the complete list of missing images.'); 