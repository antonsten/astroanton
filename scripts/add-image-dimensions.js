import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(path.dirname(__dirname), 'src/pages/articles');
const PUBLIC_DIR = path.join(path.dirname(__dirname), 'public');

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

async function addImageDimensions() {
    // Find all MDX files
    const mdxFiles = await glob('**/*.mdx', { cwd: ARTICLES_DIR });
    let totalUpdated = 0;

    for (const file of mdxFiles) {
        const filePath = path.join(ARTICLES_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');

        // Find all image references
        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        let hasChanges = false;

        // Process each image in the file
        const promises = [];
        content.replace(imageRegex, (match, alt, src) => {
            // Skip if already has width and height
            if (match.includes('width=') && match.includes('height=')) {
                return;
            }

            // Get the full path to the image
            const imagePath = path.join(PUBLIC_DIR, src);
            if (!fs.existsSync(imagePath)) {
                console.log(`⚠️ Image not found: ${src}`);
                return;
            }

            // Get image dimensions
            promises.push(
                getImageDimensions(imagePath).then(dimensions => {
                    if (dimensions) {
                        hasChanges = true;
                        const newMatch = `![${alt}](${src}){width=${dimensions.width} height=${dimensions.height}}`;
                        content = content.replace(match, newMatch);
                    }
                })
            );
        });

        // Wait for all image processing to complete
        await Promise.all(promises);

        if (hasChanges) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated: ${file}`);
            totalUpdated++;
        }
    }

    console.log(`\nSummary:`);
    console.log(`- Files updated: ${totalUpdated}`);
}

// Run the script
addImageDimensions().catch(console.error); 