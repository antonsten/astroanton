import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function generateAltText(imagePath, postTitle) {
    // Remove file extension and date prefix
    const baseName = path.basename(imagePath).replace(/\.[^/.]+$/, '');
    
    // Remove any date patterns like 2024/09/
    const cleanPath = baseName.replace(/^\d{4}\/\d{2}\//, '');
    
    // Split by common separators and clean up
    const words = cleanPath
        .split(/[-_]/)
        .map(word => word.toLowerCase())
        .filter(word => !word.match(/^\d+$/)) // Remove pure numbers
        .map(word => {
            // Convert camelCase to spaces
            return word.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
        })
        .join(' ')
        .replace(/\s+/g, ' ') // Remove extra spaces
        .trim();

    // Capitalize first letter of each word
    const titleCase = words
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // If the image name is very generic, include the post title for context
    if (words.match(/^(image|screenshot|photo|pic|img)$/i)) {
        return `Image from ${postTitle}`;
    }

    return titleCase;
}

function updateImagePathsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Update MDXImage components
    content = content.replace(
        /src="\/images\/posts\//g,
        'src="/images/articles/'
    );
    
    // Update standard markdown image syntax
    content = content.replace(
        /!\[([^\]]*)\]\(\/images\/posts\//g,
        '![$1](/images/articles/'
    );

    // Update direct image references
    content = content.replace(
        /\[.*?\]\(\/images\/posts\//g,
        match => match.replace('/images/posts/', '/images/articles/')
    );
    
    fs.writeFileSync(filePath, content);
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.mdx')) {
            updateImagePathsInFile(filePath);
            console.log(`Updated image paths in: ${filePath}`);
        }
    });
}

processDirectory(articlesDir);

async function updateImagePaths() {
    // Find all markdown files
    const files = await glob('**/*.md', { cwd: articlesDir });
    let totalUpdates = 0;

    for (const file of files) {
        const filePath = path.join(articlesDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Extract post title from frontmatter
        const titleMatch = content.match(/^---\n(?:.*\n)*title:\s*"([^"]+)".*?\n---/s);
        const postTitle = titleMatch ? titleMatch[1] : path.basename(file, '.md');
        
        // Find all image references and add alt text if missing
        // Handle both absolute paths (/images/...) and relative paths (image.png)
        const imageRegex = /!\[([^\]]*)\]\((?:\/images\/[^)]+|[^/)][^)]*\.(?:png|jpe?g|gif|webp))\)/gi;
        let match;
        let fileUpdated = false;
        
        while ((match = imageRegex.exec(content)) !== null) {
            const [fullMatch, existingAlt, imagePath] = match;
            
            // Only update if alt text is empty
            if (!existingAlt.trim()) {
                // Get the image filename whether it's an absolute or relative path
                const imageFile = imagePath.startsWith('/images/') ? 
                    imagePath.replace('/images/', '') : 
                    path.basename(imagePath);
                
                const altText = generateAltText(imageFile, postTitle);
                const newImageRef = fullMatch.replace(/!\[[^\]]*\]/, `![${altText}]`);
                
                content = content.replace(fullMatch, newImageRef);
                fileUpdated = true;
                totalUpdates++;
                
                console.log(`Adding alt text "${altText}" to image ${imagePath} in ${file}`);
            }
        }

        // Save the file if it was updated
        if (fileUpdated) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated images in: ${file}`);
        }
    }

    console.log(`\nTotal updates made: ${totalUpdates}`);
}

// Run the script
updateImagePaths().catch(console.error); 