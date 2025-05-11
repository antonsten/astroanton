import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';

const ARTICLES_DIR = 'src/content/articles';

async function fixFrontmatter() {
    try {
        const files = await readdir(ARTICLES_DIR);
        const mdxFiles = files.filter(file => file.endsWith('.mdx'));

        for (const file of mdxFiles) {
            const filePath = join(ARTICLES_DIR, file);
            const content = await readFile(filePath, 'utf-8');
            const { data, content: body } = matter(content);

            // Extract slug from filename if not present
            if (!data.slug) {
                const match = file.match(/^\d{4}-\d{2}-\d{2}-(.*?)\.mdx$/);
                if (match) {
                    data.slug = match[1];
                }
            }

            // Ensure slug is properly formatted
            if (data.slug) {
                data.slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            }

            // Write back the file with fixed frontmatter
            const newContent = matter.stringify(body, data);
            await writeFile(filePath, newContent, 'utf-8');
            console.log(`Fixed frontmatter for ${file}`);
        }
    } catch (error) {
        console.error('Error fixing frontmatter:', error);
    }
}

fixFrontmatter(); 