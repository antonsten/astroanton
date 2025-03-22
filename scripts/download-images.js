import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { mkdirp } from 'mkdirp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://www.antonsten.com';
const PUBLIC_DIR = path.join(path.dirname(__dirname), 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

// Read the missing-images.md file and extract image paths
async function getMissingImagePaths() {
    const content = fs.readFileSync('missing-images.md', 'utf8');
    const lines = content.split('\n');
    return lines
        .filter(line => line.startsWith('- '))
        .map(line => line.slice(2).trim());
}

// Download an image from the URL
async function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        https.get(url, response => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(outputPath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve(true);
                });
            } else {
                resolve(false);
            }
        }).on('error', () => resolve(false));
    });
}

// Main function to process all images
async function processImages() {
    const imagePaths = await getMissingImagePaths();
    const results = {
        successful: [],
        failed: []
    };

    // Create the base images directory if it doesn't exist
    await mkdirp(IMAGES_DIR);

    for (const imagePath of imagePaths) {
        // Create the full directory path
        const dirPath = path.join(IMAGES_DIR, path.dirname(imagePath));
        await mkdirp(dirPath);

        // Construct URLs to try
        const urls = [
            `${SITE_URL}/content/images/${imagePath}`,
            `${SITE_URL}/content/images/${path.basename(imagePath)}`,
            `${SITE_URL}/images/${imagePath}`,
            `${SITE_URL}/images/${path.basename(imagePath)}`
        ];

        let success = false;
        const outputPath = path.join(IMAGES_DIR, imagePath);

        // Try each URL until we find one that works
        for (const url of urls) {
            console.log(`Trying to download: ${url}`);
            success = await downloadImage(url, outputPath);
            if (success) {
                console.log(`✅ Successfully downloaded: ${imagePath}`);
                results.successful.push(imagePath);
                break;
            }
        }

        if (!success) {
            console.log(`❌ Failed to download: ${imagePath}`);
            results.failed.push(imagePath);
        }
    }

    // Generate report
    const report = [
        '# Image Download Report\n',
        `## Successfully Downloaded (${results.successful.length}):\n`,
        ...results.successful.map(path => `- ${path}`),
        '\n## Failed to Download (${results.failed.length}):\n',
        ...results.failed.map(path => `- ${path}`),
    ].join('\n');

    fs.writeFileSync('image-download-report.md', report);
    
    console.log('\nDownload Summary:');
    console.log(`✅ Successfully downloaded: ${results.successful.length} images`);
    console.log(`❌ Failed to download: ${results.failed.length} images`);
    console.log('\nCheck image-download-report.md for details');
}

// Run the script
processImages().catch(console.error); 