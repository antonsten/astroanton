import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import fetch from 'node-fetch';

const REPOS = [
  'antonsten/gatsby-antonsten',
  'antonsten/antonstengatsby',
  'antonsten/antonsten-gatsby',
  'antonsten/antonstencom'
];

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';
const BRANCHES = ['master', 'main'];
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'ico'];

async function downloadImage(url, targetPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    await fs.writeFile(targetPath, buffer);
    console.log(`✓ Downloaded: ${url}`);
    return true;
  } catch (error) {
    if (!error.message.includes('404')) {
      console.error(`✗ Failed to download ${url}:`, error.message);
    }
    return false;
  }
}

async function downloadFromRepos() {
  try {
    // Create images directory if it doesn't exist
    const targetDir = path.join(process.cwd(), 'public/images');
    await fs.mkdir(targetDir, { recursive: true });
    
    // Get list of existing images
    const existingImages = await fs.readdir(targetDir);
    const existingImageSet = new Set(existingImages);
    
    // Get list of missing images from our MDX files
    const mdxFiles = await glob('src/content/articles/*.mdx');
    const missingImages = new Set();
    
    // Regular expressions to match image paths
    const imageRegex = /!\[.*?\]\((.*?)\)|<img.*?src="(.*?)"|https:\/\/www\.antonsten\.com\/content\/images\/[^"\s\)]+/g;
    
    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      let match;
      
      while ((match = imageRegex.exec(content)) !== null) {
        const imagePath = match[1] || match[2] || match[0];
        if (imagePath) {
          let filename = path.basename(imagePath).split('?')[0]; // Remove query params
          
          // If filename has no extension, we'll try all extensions later
          if (!path.extname(filename)) {
            missingImages.add(filename);
          } else {
            // If filename has extension but file doesn't exist, add base name
            const baseName = path.parse(filename).name;
            missingImages.add(baseName);
          }
        }
      }
    }
    
    // Try to download missing images from each repo
    for (const repo of REPOS) {
      console.log(`\nChecking repository: ${repo}`);
      
      const possiblePaths = [
        'static/images',
        'public/images',
        'src/images',
        'content/images',
        'static/img',
        'public/img',
        'src/img',
        'content/img',
        'images',
        'img',
        'assets/images',
        'assets/img',
        'static/assets/images',
        'static/assets/img'
      ];
      
      for (const branch of BRANCHES) {
        console.log(`Checking branch: ${branch}`);
        
        for (const imageName of missingImages) {
          for (const imgPath of possiblePaths) {
            // Try each extension for each image name
            for (const ext of EXTENSIONS) {
              const filename = `${imageName}.${ext}`;
              if (existingImageSet.has(filename)) continue;
              
              const url = `${GITHUB_RAW_BASE}/${repo}/${branch}/${imgPath}/${filename}`;
              const targetPath = path.join(targetDir, filename);
              
              const success = await downloadImage(url, targetPath);
              if (success) {
                existingImageSet.add(filename);
                break; // Move to next image if successfully downloaded
              }
            }
          }
        }
      }
    }
    
    console.log('\nFinished checking repositories');
    
    // List remaining missing images
    const remainingMissing = [...missingImages].filter(img => {
      return !EXTENSIONS.some(ext => existingImageSet.has(`${img}.${ext}`));
    });
    
    if (remainingMissing.length > 0) {
      console.log('\nStill missing images:');
      remainingMissing.forEach(img => console.log(`- ${img}`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

downloadFromRepos(); 