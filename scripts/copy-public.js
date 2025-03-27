import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(path.dirname(__dirname), 'public');
const DIST_DIR = path.join(path.dirname(__dirname), 'dist');

function copyFolderSync(from, to) {
    // Create the destination folder if it doesn't exist
    if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
    }

    // Read all files/folders in the source directory
    const items = fs.readdirSync(from, { withFileTypes: true });

    for (const item of items) {
        const fromPath = path.join(from, item.name);
        const toPath = path.join(to, item.name);

        if (item.isDirectory()) {
            // Recursively copy directories
            copyFolderSync(fromPath, toPath);
        } else {
            // Copy files
            fs.copyFileSync(fromPath, toPath);
            console.log(`✅ Copied: ${path.relative(PUBLIC_DIR, fromPath)}`);
        }
    }
}

try {
    console.log('Starting to copy public directory...');
    copyFolderSync(PUBLIC_DIR, DIST_DIR);
    console.log('Public directory copy complete!');
} catch (error) {
    console.error('Error copying public directory:', error);
    process.exit(1);
} 