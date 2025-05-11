import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { generateSlugFromTitle } from '../src/utils/slugUtils';

const CONTENT_DIR = join(process.cwd(), 'src/content/articles');

interface ArticleMetadata {
    title: string;
    date: string;
    slug: string;
}

function extractTitleFromFilename(filename: string): string {
    // Remove date and extension
    const withoutDate = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const withoutExt = withoutDate.replace(/\.mdx$/, '');
    
    // Handle special characters and convert to title case
    return withoutExt
        .split('-')
        .map(word => {
            // Handle special cases like numbers with hash
            if (word.match(/^\d+$/)) return `#${word}`;
            // Handle common abbreviations
            if (word.toUpperCase() === word) return word;
            // Convert to title case, preserving common words
            return word
                .replace(/^[a-z]/, c => c.toUpperCase())
                .replace(/[A-Z]{2,}/, w => w.charAt(0) + w.slice(1).toLowerCase());
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractDateFromFilename(filename: string): string | null {
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
}

function generateSlugFromFilename(filename: string): string {
    // Remove date and extension
    const withoutDate = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const withoutExt = withoutDate.replace(/\.mdx$/, '');
    
    return withoutExt
        .toLowerCase()
        .replace(/[.&#@!?'",()]/g, '')    // Remove common punctuation
        .replace(/[^a-z0-9-]/g, '-')      // Replace any other non-alphanumeric chars with hyphens
        .replace(/--+/g, '-')             // Replace multiple consecutive hyphens with a single one
        .replace(/^-+|-+$/g, '');         // Remove leading/trailing hyphens
}

async function fixMissingFrontmatter(file: string): Promise<void> {
    const filePath = join(CONTENT_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    
    // Handle both Unix (LF) and Windows (CRLF) line endings
    const normalizedContent = content.replace(/\r\n/g, '\n');
    
    // Check if file already has frontmatter
    if (normalizedContent.match(/^---[ \t]*\n/)) {
        return;
    }
    
    const title = extractTitleFromFilename(file);
    const date = extractDateFromFilename(file);
    
    if (!date) {
        console.error(`Could not extract date from filename: ${file}`);
        return;
    }
    
    const slug = generateSlugFromFilename(file);
    
    const frontmatter: ArticleMetadata = {
        title,
        date,
        slug
    };
    
    const newContent = `---
title: "${title}"
date: ${date}
slug: ${slug}
---

${content}`;
    
    await writeFile(filePath, newContent);
    console.log(`Added frontmatter to ${file}`);
}

async function fixAllMissingFrontmatter() {
    try {
        const files = await readdir(CONTENT_DIR);
        const mdxFiles = files.filter(file => file.endsWith('.mdx'));
        
        console.log(`Found ${mdxFiles.length} MDX files to check`);
        
        for (const file of mdxFiles) {
            try {
                await fixMissingFrontmatter(file);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Failed to fix ${file}:`, errorMessage);
            }
        }
        
        console.log('\nFrontmatter fixes complete! Running content fixes...');
        
        // Run the main content fix script after adding frontmatter
        const { fixAllContent } = await import('./fixContent');
        await fixAllContent();
        
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fix missing frontmatter:', errorMessage);
        process.exit(1);
    }
}

fixAllMissingFrontmatter(); 