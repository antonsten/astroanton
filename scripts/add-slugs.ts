import fs from 'fs';
import path from 'path';

const articlesDir = path.join(process.cwd(), 'src/content/articles');

// Read all files in the articles directory
const files = fs.readdirSync(articlesDir);

files.forEach(file => {
    if (!file.endsWith('.mdx')) return;

    const filePath = path.join(articlesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract the slug from the filename (remove date prefix)
    const slug = file.split('-').slice(3).join('-').replace('.mdx', '');

    // Check if the file already has a slug
    if (content.includes('slug:')) return;

    // Add the slug to the frontmatter
    const updatedContent = content.replace(
        /^---\n/,
        `---\nslug: ${slug}\n`
    );

    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Added slug to ${file}`);
}); 