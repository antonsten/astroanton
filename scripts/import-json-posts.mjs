import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';
import crypto from 'crypto';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

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
        if (!response.ok) {
            console.warn(`Failed to download image ${imageUrl}: ${response.statusText}`);
            return null;
        }
        const buffer = await response.buffer();

        // Optimize image
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Save webp version
        await image
            .resize(1000, null, { withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(outputPath.replace(ext, '.webp'));

        return filename.replace(ext, '.webp');
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
        // Convert figures with images
        .replace(/<figure[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<figcaption>([\s\S]*?)<\/figcaption>[\s\S]*?<\/figure>/g, async (match, src, caption) => {
            return `\n![${caption.trim()}](${src})\n`;
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

// Convert post to MDX format
async function convertPostToMdx(post, outputDir) {
    const frontmatter = {
        layout: "../../layouts/BlogPost.astro",
        title: post.title,
        description: post.excerpt || post.custom_excerpt || '',
        publishDate: post.published_at ? post.published_at.split('T')[0] : new Date().toISOString().split('T')[0],
        minutesToRead: post.reading_time ? Math.ceil(post.reading_time) : calculateReadingTime(post.html || '')
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
        // Read the JSON file
        const jsonPath = path.join(__dirname, '..', 'posts.json');
        const postsData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
        const posts = Array.isArray(postsData) ? postsData : postsData.posts || [];

        // Create necessary directories
        const articlesDir = path.join(__dirname, '..', 'src', 'pages', 'articles');
        const imagesDir = path.join(__dirname, '..', 'public', 'images', 'blog');
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

// Run the import
importPosts(); 