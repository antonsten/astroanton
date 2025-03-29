import fs from 'fs';
import path from 'path';

const articlesDir = path.join(process.cwd(), 'src/content/articles');

// Function to convert title to sentence case
function toSentenceCase(title: string): string {
    // Remove any existing quotes
    title = title.replace(/^["']|["']$/g, '');
    
    // Split into words
    const words = title.split(' ');
    
    // Capitalize first word and proper nouns
    const sentenceCase = words.map((word, index) => {
        if (index === 0) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        // Keep proper nouns capitalized
        if (word.match(/^[A-Z]/)) {
            return word;
        }
        return word.toLowerCase();
    }).join(' ');
    
    return `"${sentenceCase}"`;
}

// Read all files in the articles directory
fs.readdir(articlesDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    // Process each MDX file
    files.forEach(file => {
        if (!file.endsWith('.mdx')) return;

        const filePath = path.join(articlesDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Extract frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) return;

        const frontmatter = frontmatterMatch[1];
        
        // Find and update title
        const titleMatch = frontmatter.match(/title:\s*(.*)/);
        if (titleMatch) {
            const oldTitle = titleMatch[1];
            const newTitle = toSentenceCase(oldTitle);
            
            // Update the title in the content
            content = content.replace(
                /title:\s*(.*)/,
                `title: ${newTitle}`
            );
            
            // Write the updated content back to the file
            fs.writeFileSync(filePath, content);
            console.log(`Updated title in ${file}: ${oldTitle} → ${newTitle}`);
        }
    });
}); 