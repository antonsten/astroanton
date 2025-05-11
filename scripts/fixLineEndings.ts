import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const ARTICLES_DIR = 'src/content/articles';

async function fixLineEndings() {
    try {
        const files = await readdir(ARTICLES_DIR);
        const mdxFiles = files.filter(file => file.endsWith('.mdx'));

        for (const file of mdxFiles) {
            const filePath = join(ARTICLES_DIR, file);
            let content = await readFile(filePath, 'utf-8');

            // Normalize line endings to LF
            content = content.replace(/\r\n/g, '\n');

            // Fix any potential BOM characters
            content = content.replace(/^\uFEFF/, '');

            // Ensure frontmatter has proper spacing
            content = content.replace(/^---\s*\n/, '---\n');
            content = content.replace(/\n---\s*\n/, '\n---\n');

            // Remove any extra whitespace in frontmatter
            const [frontmatter, ...rest] = content.split('\n---\n');
            const cleanedFrontmatter = frontmatter
                .split('\n')
                .map(line => line.trim())
                .join('\n');

            const newContent = [cleanedFrontmatter, ...rest].join('\n---\n');

            await writeFile(filePath, newContent, 'utf-8');
            console.log(`Fixed line endings for ${file}`);
        }
    } catch (error) {
        console.error('Error fixing line endings:', error);
    }
}

fixLineEndings(); 