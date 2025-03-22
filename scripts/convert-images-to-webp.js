import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import sharp from 'sharp';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(path.dirname(__dirname), 'public/images');
const QUALITY = 80; // WebP quality setting

async function convertToWebP(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .webp({ quality: QUALITY })
            .toFile(outputPath);
        console.log(`✅ Converted: ${path.basename(inputPath)}`);
        return true;
    } catch (error) {
        console.error(`❌ Error converting ${inputPath}:`, error);
        return false;
    }
}

async function processImages() {
    // Find all image files
    const imageFiles = await glob('**/*.{jpg,jpeg,png}', { cwd: IMAGES_DIR });
    let totalConverted = 0;

    for (const file of imageFiles) {
        const inputPath = path.join(IMAGES_DIR, file);
        const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

        // Skip if WebP version already exists
        if (fs.existsSync(outputPath)) {
            console.log(`ℹ️ WebP already exists: ${path.basename(file)}`);
            continue;
        }

        const success = await convertToWebP(inputPath, outputPath);
        if (success) totalConverted++;
    }

    console.log(`\nTotal images converted: ${totalConverted}`);
}

// Run the script
processImages().catch(console.error); 