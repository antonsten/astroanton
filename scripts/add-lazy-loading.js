import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(path.dirname(__dirname), 'src/pages/articles');

async function addLazyLoading() {
    // Find all MDX files
    const mdxFiles = await glob('**/*.mdx', { cwd: ARTICLES_DIR });
    let totalUpdated = 0;

    for (const file of mdxFiles) {
        const filePath = path.join(ARTICLES_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');

        // Find all image references that don't already have loading="lazy"
        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        let hasChanges = false;

        content = content.replace(imageRegex, (match, alt, src) => {
            // Skip if already has loading="lazy"
            if (match.includes('loading="lazy"')) {
                return match;
            }
            hasChanges = true;
            return `![${alt}](${src}){loading="lazy"}`;
        });

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
addLazyLoading().catch(console.error); 