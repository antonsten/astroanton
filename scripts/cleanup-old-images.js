import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(path.dirname(__dirname), 'public/images');

async function cleanupOldImages() {
    // Find all original image files
    const imageFiles = await glob('**/*.{jpg,jpeg,png}', { cwd: IMAGES_DIR });
    let totalRemoved = 0;
    let totalSkipped = 0;

    for (const file of imageFiles) {
        const imagePath = path.join(IMAGES_DIR, file);
        const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

        // Check if WebP version exists
        if (fs.existsSync(webpPath)) {
            // Get file sizes
            const originalSize = fs.statSync(imagePath).size;
            const webpSize = fs.statSync(webpPath).size;

            // Only remove if WebP is smaller
            if (webpSize < originalSize) {
                fs.unlinkSync(imagePath);
                console.log(`✅ Removed: ${file} (saved ${((originalSize - webpSize) / 1024).toFixed(2)}KB)`);
                totalRemoved++;
            } else {
                console.log(`⚠️ Skipped: ${file} (WebP is larger)`);
                totalSkipped++;
            }
        } else {
            console.log(`⚠️ Skipped: ${file} (no WebP version found)`);
            totalSkipped++;
        }
    }

    console.log(`\nSummary:`);
    console.log(`- Files removed: ${totalRemoved}`);
    console.log(`- Files skipped: ${totalSkipped}`);
    console.log(`- Total space saved: ${((totalRemoved * 1024) / 1024 / 1024).toFixed(2)}MB`);
}

// Run the script
cleanupOldImages().catch(console.error); 