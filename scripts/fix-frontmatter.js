import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(path.dirname(__dirname), 'src/content/posts');

function fixQuotes(str) {
    // Replace curly quotes with straight quotes
    return str
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        // Preserve apostrophes
        .replace(/(\w)'(\w)/g, "$1'$2")
        // Ensure the title is wrapped in double quotes
        .replace(/^([^"'].+[^"'])$/, '"$1"');
}

async function fixFrontmatter() {
    // Find all markdown files
    const files = await glob('**/*.md', { cwd: POSTS_DIR });
    let totalUpdates = 0;

    for (const file of files) {
        const filePath = path.join(POSTS_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let wasUpdated = false;
        
        // Check if the file has frontmatter
        if (content.startsWith('---')) {
            // Extract frontmatter
            const frontmatterMatch = content.match(/^---([\s\S]*?)---/);
            if (frontmatterMatch) {
                let frontmatter = frontmatterMatch[1];
                const originalFrontmatter = frontmatter;

                // Fix empty tags field
                frontmatter = frontmatter.replace(/^tags:\s*$/m, 'tags: []');
                
                // Fix quotes in title
                frontmatter = frontmatter.replace(/^title:\s*(.+)$/m, (match, title) => {
                    // Remove leading/trailing whitespace and quotes
                    title = title.trim().replace(/^["']|["']$/g, '');
                    // Replace curly quotes with straight quotes
                    title = title
                        .replace(/[""]/g, '"')
                        .replace(/['']/g, "'");
                    // Wrap in double quotes
                    return `title: "${title}"`;
                });

                // Fix date format if needed
                frontmatter = frontmatter.replace(/^(publish|update)Date:\s*"([^"]+)"$/mg, (match, type, date) => {
                    // Ensure date is in ISO format
                    const d = new Date(date);
                    return `${type}Date: "${d.toISOString()}"`;
                });

                // Only update if changes were made
                if (frontmatter !== originalFrontmatter) {
                    content = content.replace(/^---([\s\S]*?)---/, `---${frontmatter}---`);
                    fs.writeFileSync(filePath, content);
                    console.log(`✅ Fixed frontmatter in: ${file}`);
                    console.log('   Changes made:');
                    if (frontmatter !== originalFrontmatter) {
                        console.log('   - Updated frontmatter format');
                    }
                    totalUpdates++;
                    wasUpdated = true;
                }
            }
        }

        if (!wasUpdated) {
            console.log(`ℹ️ No changes needed in: ${file}`);
        }
    }

    console.log(`\nTotal files updated: ${totalUpdates}`);
}

// Run the script
fixFrontmatter().catch(console.error); 