import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(path.dirname(__dirname), 'src/pages/articles');

async function findIncorrectImagePaths() {
    // Find all MDX files
    const files = await glob('**/*.mdx', { cwd: ARTICLES_DIR });
    let totalIssues = 0;

    for (const file of files) {
        const filePath = path.join(ARTICLES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Find image references that don't start with /images/
        const incorrectPaths = content.match(/!\[(.*?)\]\((?!\/images\/)[^)]+\)/g);
        
        if (incorrectPaths) {
            console.log(`\n❌ Found incorrect image paths in: ${file}`);
            incorrectPaths.forEach(path => {
                console.log(`  ${path}`);
                totalIssues++;
            });
        }
    }

    console.log(`\nTotal incorrect image paths found: ${totalIssues}`);
}

// Run the script
findIncorrectImagePaths().catch(console.error); 