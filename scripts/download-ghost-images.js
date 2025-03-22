import dotenv from 'dotenv';
import GhostContentAPI from '@tryghost/content-api';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config();

const api = new GhostContentAPI({
  url: process.env.GHOST_URL,
  key: process.env.GHOST_API_KEY,
  version: 'v5.0'
});

const PUBLIC_DIR = 'public/images';

async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    
    const buffer = await response.buffer();
    await fs.writeFile(filename, buffer);
    console.log(`✓ Downloaded: ${filename}`);
  } catch (error) {
    console.error(`✗ Failed to download ${url}:`, error.message);
  }
}

async function ensureDirectoryExists(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

async function downloadAllImages() {
  try {
    await ensureDirectoryExists(PUBLIC_DIR);
    
    const posts = await api.posts.browse({
      limit: 'all',
      include: 'tags,authors'
    });
    
    const imageUrls = new Set();
    
    // Extract image URLs from posts
    for (const post of posts) {
      const regex = /!\[.*?\]\((.*?)\)|<img.*?src="(.*?)"/g;
      let match;
      
      while ((match = regex.exec(post.html)) !== null) {
        const url = match[1] || match[2];
        if (url && !url.startsWith('data:')) {
          imageUrls.add(url);
        }
      }
      
      // Also get feature images if they exist
      if (post.feature_image) {
        imageUrls.add(post.feature_image);
      }
    }
    
    console.log(`Found ${imageUrls.size} unique images`);
    
    // Download all images
    for (const url of imageUrls) {
      const filename = path.join(PUBLIC_DIR, path.basename(url));
      await downloadImage(url, filename);
    }
    
    console.log('Finished downloading images');
  } catch (error) {
    console.error('Error:', error);
  }
}

downloadAllImages(); 