import { readdir, readFile, writeFile, rename } from 'fs/promises';
import { join } from 'path';
import { parse, stringify } from 'yaml';
import { validateAndNormalizeSlug, generateSlugFromTitle } from '../src/utils/slugUtils';

const CONTENT_DIR = join(process.cwd(), 'src/content/articles');

interface Frontmatter {
    title: string;
    date: string | Date;
    slug?: string;
    [key: string]: unknown;
}

async function extractFrontmatter(content: string): Promise<{ frontmatter: Frontmatter; content: string }> {
    // Handle both Unix (LF) and Windows (CRLF) line endings
    const normalizedContent = content.replace(/\r\n/g, '\n');
    
    // More robust regex that handles optional spaces after --- and empty lines
    const match = normalizedContent.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)([\s\S]*)$/);
    
    if (!match) {
        throw new Error('No frontmatter found');
    }

    try {
        return {
            frontmatter: parse(match[1]),
            content: match[2]
        };
    } catch (error) {
        throw new Error(`Invalid YAML in frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function fixFile(file: string): Promise<void> {
    const filePath = join(CONTENT_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    
    try {
        console.log(`Processing ${file}...`);
        
        // Handle both Unix (LF) and Windows (CRLF) line endings
        const normalizedContent = content.replace(/\r\n/g, '\n');
        
        // More robust frontmatter extraction
        const frontmatterMatch = normalizedContent.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)([\s\S]*)$/);
        
        if (!frontmatterMatch) {
            throw new Error('No frontmatter found');
        }
        
        let frontmatter: Frontmatter;
        try {
            frontmatter = parse(frontmatterMatch[1]);
            console.log('Original frontmatter:', frontmatter);
        } catch (error) {
            console.error('Failed to parse frontmatter:', error);
            throw new Error('Invalid YAML in frontmatter');
        }
        
        const mdContent = frontmatterMatch[2];
        let modified = false;
        
        // Ensure required fields exist
        if (!frontmatter.title) {
            frontmatter.title = extractTitleFromFilename(file);
            modified = true;
            console.log(`Generated title for ${file}: ${frontmatter.title}`);
        }
        
        if (!frontmatter.date) {
            const date = extractDateFromFilename(file);
            if (date) {
                frontmatter.date = date;
                modified = true;
                console.log(`Generated date for ${file}: ${frontmatter.date}`);
            }
        }
        
        // Fix or generate slug
        if (!frontmatter.slug || typeof frontmatter.slug !== 'string' || frontmatter.slug.trim() === '') {
            frontmatter.slug = generateSlugFromTitle(frontmatter.title);
            modified = true;
            console.log(`Generated slug for ${file}: ${frontmatter.slug}`);
        } else {
            try {
                // Clean up special characters before validation
                const cleanSlug = frontmatter.slug
                    .toLowerCase()
                    .replace(/[.&#@!?'",()]/g, '') // Remove common punctuation
                    .replace(/[^a-z0-9-]/g, '-')   // Replace any other non-alphanumeric chars with hyphens
                    .replace(/--+/g, '-')          // Replace multiple consecutive hyphens with a single one
                    .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
                
                console.log(`Cleaned slug: ${cleanSlug}`);
                const normalizedSlug = validateAndNormalizeSlug(cleanSlug);
                if (normalizedSlug !== frontmatter.slug) {
                    frontmatter.slug = normalizedSlug;
                    modified = true;
                    console.log(`Normalized slug for ${file}: ${frontmatter.slug}`);
                }
            } catch (error) {
                console.log(`Error with slug "${frontmatter.slug}":`, error instanceof Error ? error.message : 'Unknown error');
                frontmatter.slug = generateSlugFromTitle(frontmatter.title);
                modified = true;
                console.log(`Replaced invalid slug for ${file}: ${frontmatter.slug}`);
            }
        }
        
        // Fix date format and filename if needed
        const date = new Date(frontmatter.date);
        const formattedDate = date.toISOString().split('T')[0];
        
        if (frontmatter.date.toString() !== formattedDate) {
            frontmatter.date = formattedDate;
            modified = true;
            console.log(`Fixed date format for ${file}: ${formattedDate}`);
        }
        
        const expectedFilename = `${formattedDate}-${frontmatter.slug}.mdx`;
        
        if (modified) {
            // Log final frontmatter for debugging
            console.log(`Updated frontmatter:`, frontmatter);
            
            // Write updated frontmatter with consistent formatting
            const updatedContent = `---
title: "${frontmatter.title}"
description: ${frontmatter.description ? `"${frontmatter.description}"` : '"A short reflection on user experience and design."'}
date: ${frontmatter.date}
slug: ${frontmatter.slug}
readingTime: ${frontmatter.readingTime || 5}
---

${mdContent}`;
            
            await writeFile(filePath, updatedContent);
            console.log(`Updated frontmatter for ${file}`);
        }
        
        // Rename file if date doesn't match
        if (file !== expectedFilename) {
            const newPath = join(CONTENT_DIR, expectedFilename);
            await rename(filePath, newPath);
            console.log(`Renamed ${file} to ${expectedFilename}`);
        }
        
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to fix ${file}:`, errorMessage);
    }
}

async function fixAllContent() {
    try {
        const files = await readdir(CONTENT_DIR);
        const mdxFiles = files.filter(file => file.endsWith('.mdx'));
        
        console.log(`Found ${mdxFiles.length} MDX files to process`);
        
        for (const file of mdxFiles) {
            await fixFile(file);
        }
        
        console.log('\nContent fixes complete! Running validation...');
        
        // Run validation after fixes
        const { validateContentFiles } = await import('./validateContent');
        await validateContentFiles();
        
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fix content:', errorMessage);
        process.exit(1);
    }
}

export { fixAllContent };

fixAllContent(); 