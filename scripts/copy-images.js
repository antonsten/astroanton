import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Read and parse the Ghost export file to find all image references
const ghostData = JSON.parse(fs.readFileSync(path.join(rootDir, 'posts.json'), 'utf8'));
const posts = ghostData.db[0].data.posts;

// Create images directory if it doesn't exist
const publicImagesDir = path.join(rootDir, 'public', 'images');
fs.mkdirSync(publicImagesDir, { recursive: true });

// Function to extract image paths from HTML content
function extractImagePaths(content) {
  const paths = new Set();
  const regex = /src="[^"]*\/images\/([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    paths.add(match[1]);
  }

  // Also check srcset
  const srcsetRegex = /srcset="([^"]+)"/g;
  while ((match = srcsetRegex.exec(content)) !== null) {
    const srcset = match[1];
    const srcsetPaths = srcset.split(',').map(s => {
      const pathMatch = s.trim().match(/\/images\/([^\s]+)/);
      return pathMatch ? pathMatch[1] : null;
    }).filter(Boolean);
    
    srcsetPaths.forEach(p => paths.add(p));
  }

  return Array.from(paths);
}

// Collect all image paths from posts
const imagePaths = new Set();
posts.forEach(post => {
  if (post.html) {
    extractImagePaths(post.html).forEach(path => imagePaths.add(path));
  }
});

// Copy images
console.log('\nCopying images...');
let copied = 0;
let errors = 0;

imagePaths.forEach(imagePath => {
  const sourcePath = path.join(rootDir, 'content', 'images', imagePath);
  const targetPath = path.join(publicImagesDir, imagePath);

  // Create target directory if it doesn't exist
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  try {
    // Copy the file if it exists
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied: ${imagePath}`);
      copied++;
    } else {
      console.error(`Error: Source image not found: ${imagePath}`);
      errors++;
    }
  } catch (error) {
    console.error(`Error copying ${imagePath}: ${error.message}`);
    errors++;
  }
});

console.log(`\nDone! Copied ${copied} images. ${errors} errors encountered.`); 