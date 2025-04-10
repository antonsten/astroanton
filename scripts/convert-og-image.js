import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../public/images/og-image.png');
const outputPath = path.join(__dirname, '../public/images/og-image.webp');

async function convertToWebP() {
    try {
        await sharp(inputPath)
            .webp({ quality: 80 })
            .toFile(outputPath);
        console.log('✅ Successfully converted og-image.png to og-image.webp');
    } catch (error) {
        console.error('Error converting image:', error);
    }
}

convertToWebP(); 