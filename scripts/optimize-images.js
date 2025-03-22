import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import sharp from 'sharp';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(path.dirname(__dirname), 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const ARTICLES_DIR = path.join(path.dirname(__dirname), 'src/pages/articles');

const QUALITY = 80;

async function convertToWebP(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .webp({ quality: QUALITY })
            .toFile(outputPath);
        console.log(`✅ Converted: ${path.basename(inputPath)}`);
    } catch (error) {
        console.error(`Error converting ${inputPath}:`, error);
    }
}

async function getImageDimensions(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();
        return {
            width: metadata.width,
            height: metadata.height
        };
    } catch (error) {
        console.error(`Error getting dimensions for ${imagePath}:`, error);
        return null;
    }
}

async function updateMDXFiles(imagePath) {
    const relativePath = path.relative(PUBLIC_DIR, imagePath);
    const imageName = path.basename(imagePath);
    const webpName = imageName.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const webpPath = path.join(path.dirname(imagePath), webpName);
    const webpRelativePath = path.relative(PUBLIC_DIR, webpPath);

    // Get image dimensions
    const dimensions = await getImageDimensions(imagePath);
    if (!dimensions) return;

    // Find all MDX files
    const mdxFiles = await glob('**/*.mdx', { cwd: ARTICLES_DIR });

    for (const file of mdxFiles) {
        const filePath = path.join(ARTICLES_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');

        // Find image references
        const imageRegex = new RegExp(`!\\[(.*?)\\]\\(${relativePath}\\)`, 'g');
        let hasChanges = false;

        content = content.replace(imageRegex, (match, alt) => {
            hasChanges = true;
            // Use a simpler MDX syntax that's more compatible
            return `![${alt}](${webpRelativePath}){width=${dimensions.width} height=${dimensions.height}}`;
        });

        if (hasChanges) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated MDX: ${file}`);
        }
    }
}

async function processImage(imagePath) {
    // Convert to WebP
    const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    await convertToWebP(imagePath, webpPath);

    // Update MDX files
    await updateMDXFiles(imagePath);
}

async function optimizeImages() {
    // Process existing images
    const imageFiles = await glob('**/*.{jpg,jpeg,png}', { cwd: IMAGES_DIR });
    console.log(`Found ${imageFiles.length} images to process...`);

    for (const file of imageFiles) {
        const imagePath = path.join(IMAGES_DIR, file);
        await processImage(imagePath);
    }

    // Watch for new images
    console.log('\nWatching for new images...');
    chokidar.watch('**/*.{jpg,jpeg,png}', {
        cwd: IMAGES_DIR,
        ignoreInitial: true
    }).on('add', async (file) => {
        const imagePath = path.join(IMAGES_DIR, file);
        await processImage(imagePath);
    });
}

// Run the script
optimizeImages().catch(console.error); 