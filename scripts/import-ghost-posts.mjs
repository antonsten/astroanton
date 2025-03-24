import GhostContentAPI from '@tryghost/content-api';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dirname } from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configure the Ghost API client
const api = new GhostContentAPI({
    url: process.env.GHOST_URL,
    key: process.env.GHOST_API_KEY,
    version: 'v5.0'
});

// Function to generate a hash for the image URL
function generateImageHash(url) {
    return crypto.createHash('md5').update(url).digest('hex');
}

// Function to download and optimize image
async function downloadAndOptimizeImage(imageUrl, outputDir) {
    try {
        // Generate a hash of the URL for the filename
        const hash = generateImageHash(imageUrl);
        const ext = path.extname(imageUrl).toLowerCase() || '.jpg';
        const filename = `${hash}${ext}`;
        const outputPath = path.join(outputDir, filename);

        // Check if image already exists
        try {
            await fs.access(outputPath);
            return filename; // Image already exists
        } catch {
            // Image doesn't exist, proceed with download
        }

        // Download image
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
        const buffer = await response.buffer();

        // Optimize image
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Create different sizes
        const sizes = [600, 1000, metadata.width || 2000].sort((a, b) => a - b);
        const outputPaths = [];

        for (const width of sizes) {
            if (width > (metadata.width || 0)) break;
            
            const sizeFilename = width === metadata.width 
                ? filename 
                : `${hash}-${width}${ext}`;
            const sizePath = path.join(outputDir, sizeFilename);
            
            await image
                .resize(width, null, { withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(sizePath.replace(ext, '.webp'));

            outputPaths.push({
                width,
                filename: sizeFilename.replace(ext, '.webp')
            });
        }

        return {
            originalName: filename,
            sizes: outputPaths
        };
    } catch (error) {
        console.error(`Error processing image ${imageUrl}:`, error);
        return null;
    }
}

// Convert HTML to MDX-compatible format
async function convertHtmlToMdx(html, outputDir) {
    if (!html) return '';

    let mdx = html
        // Convert blockquotes
        .replace(/<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/g, (_, attrs, content) => {
            content = content.trim();
            return `\n<div class="blockquote">${content}</div>\n`;
        })
        // Convert figures and images
        .replace(/<figure[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<\/figure>/g, (match, src) => {
            return `\n![](${src})\n`;
        })
        // Convert standalone images
        .replace(/<img[^>]*src="([^"]*)"[^>]*>/g, (match, src) => {
            return `\n![](${src})\n`;
        })
        // Convert iframes (especially YouTube)
        .replace(/<iframe[^>]*src="[^"]*(?:youtube\.com|youtu\.be)\/(?:embed\/|watch\?v=)?([^"&?\s]*)[^"]*"[^>]*><\/iframe>/g, (match, videoId) => {
            return `\n<YouTube videoId="${videoId}" />\n`;
        })
        // Remove $1 placeholders
        .replace(/\$1/g, '')
        // Clean up extra newlines and spaces
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return mdx;
}

// Calculate reading time
function calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

// Convert Ghost post to MDX format
async function convertPostToMdx(post, outputDir) {
    const frontmatter = {
        layout: "../../layouts/BlogPost.astro",
        title: post.title,
        description: post.excerpt || post.custom_excerpt || '',
        publishDate: post.published_at ? post.published_at.split('T')[0] : new Date().toISOString().split('T')[0],
        minutesToRead: Math.ceil(post.reading_time) || 3
    };

    const frontmatterYaml = Object.entries(frontmatter)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');

    const content = await convertHtmlToMdx(post.html || '', outputDir);

    return `---\n${frontmatterYaml}\n---\n\n${content}`;
}

// Sanitize string for filename
function sanitizeFilename(string) {
    return string
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function importPosts() {
    try {
        console.log('Fetching posts from Ghost...');
        const posts = await api.posts.browse({
            limit: 'all',
            include: ['tags', 'authors'],
            formats: ['html']
        });

        // Create necessary directories
        const articlesDir = path.join(__dirname, '..', 'src', 'pages', 'articles');
        const imagesDir = path.join(__dirname, '..', 'public', 'images');
        await fs.mkdir(articlesDir, { recursive: true });
        await fs.mkdir(imagesDir, { recursive: true });

        // Create a placeholder image
        const placeholderPath = path.join(imagesDir, 'placeholder.webp');
        try {
            await fs.access(placeholderPath);
        } catch {
            await sharp({
                create: {
                    width: 600,
                    height: 400,
                    channels: 4,
                    background: { r: 243, g: 243, b: 241, alpha: 1 }
                }
            })
            .webp()
            .toFile(placeholderPath);
        }

        console.log(`Converting ${posts.length} posts to MDX...`);
        for (const post of posts) {
            const filename = `${sanitizeFilename(post.slug)}.mdx`;
            const filePath = path.join(articlesDir, filename);
            const mdxContent = await convertPostToMdx(post, imagesDir);

            await fs.writeFile(filePath, mdxContent, 'utf8');
            console.log(`Saved ${filename}`);
        }

        console.log('Import completed successfully!');
    } catch (error) {
        console.error('Error importing posts:', error);
    }
}

// Check if environment variables are set
if (!process.env.GHOST_URL || !process.env.GHOST_API_KEY) {
    console.error('Please set GHOST_URL and GHOST_API_KEY environment variables');
    process.exit(1);
}

importPosts(); 