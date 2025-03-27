import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(path.dirname(__dirname), 'public');
const DIST_DIR = path.join(path.dirname(__dirname), 'dist');

async function copyPublicToDist() {
    try {
        // Find all files in public directory
        const files = await glob('**/*', { 
            cwd: PUBLIC_DIR,
            nodir: true,
            dot: true
        });

        console.log(`Found ${files.length} files to copy...`);

        for (const file of files) {
            const sourcePath = path.join(PUBLIC_DIR, file);
            const targetPath = path.join(DIST_DIR, file);

            // Create directory if it doesn't exist
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Copy file
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`✅ Copied: ${file}`);
        }

        console.log('Public directory copy complete!');
    } catch (error) {
        console.error('Error copying public directory:', error);
        process.exit(1);
    }
}

// Run the script
copyPublicToDist().catch(console.error); 