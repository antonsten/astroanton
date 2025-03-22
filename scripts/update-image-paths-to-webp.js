import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(path.dirname(__dirname), 'src/pages/articles');
const IMAGES_DIR = path.join(path.dirname(__dirname), 'public/images');

async function updateImagePaths() {
    // Find all MDX files
    const files = await glob('**/*.mdx', { cwd: ARTICLES_DIR });
    let totalUpdated = 0;

    for (const file of files) {
        const filePath = path.join(ARTICLES_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let wasUpdated = false;

        // Find all image references
        const imageRefs = content.match(/!\[(.*?)\]\((\/images\/[^)]+)\)/g);
        
        if (imageRefs) {
            for (const ref of imageRefs) {
                const match = ref.match(/!\[(.*?)\]\((\/images\/[^)]+)\)/);
                if (!match) continue;

                const [, alt, imagePath] = match;
                const fullImagePath = path.join(process.cwd(), 'public', imagePath);
                const webpPath = fullImagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

                // Check if WebP version exists
                if (fs.existsSync(webpPath)) {
                    const newImagePath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                    const newRef = `![${alt}](${newImagePath})`;
                    
                    if (ref !== newRef) {
                        content = content.replace(ref, newRef);
                        wasUpdated = true;
                        console.log(`✅ Updated image path in ${file}: ${imagePath} -> ${newImagePath}`);
                    }
                }
            }
        }

        if (wasUpdated) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated file: ${file}`);
            totalUpdated++;
        }
    }

    console.log(`\nTotal files updated: ${totalUpdated}`);
}

// Run the script
updateImagePaths().catch(console.error); 