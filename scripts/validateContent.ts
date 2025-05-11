import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'yaml';
import { validateAndNormalizeSlug } from '../src/utils/slugUtils';

const CONTENT_DIR = join(process.cwd(), 'src/content/articles');

async function extractFrontmatter(filePath: string): Promise<any> {
    const content = await readFile(filePath, 'utf-8');
    
    // Handle both Unix (LF) and Windows (CRLF) line endings
    const normalizedContent = content.replace(/\r\n/g, '\n');
    
    // More robust regex that handles optional spaces after --- and empty lines
    const match = normalizedContent.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
    
    if (!match) {
        throw new Error(`No frontmatter found in ${filePath}`);
    }

    try {
        return parse(match[1]);
    } catch (error) {
        throw new Error(`Invalid YAML in frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function validateContentFiles() {
    try {
        const files = await readdir(CONTENT_DIR);
        const mdxFiles = files.filter(file => file.endsWith('.mdx'));
        
        console.log(`Found ${mdxFiles.length} MDX files to validate`);
        
        const errors: string[] = [];

        for (const file of mdxFiles) {
            try {
                const filePath = join(CONTENT_DIR, file);
                const frontmatter = await extractFrontmatter(filePath);
                
                // Check required fields
                if (!frontmatter.title) {
                    errors.push(`${file}: Missing title`);
                }
                
                if (!frontmatter.date) {
                    errors.push(`${file}: Missing date`);
                }
                
                if (!frontmatter.slug) {
                    errors.push(`${file}: Missing slug`);
                } else {
                    try {
                        validateAndNormalizeSlug(frontmatter.slug);
                    } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        errors.push(`${file}: Invalid slug format - ${errorMessage}`);
                    }
                }
                
                // Validate date format in filename matches frontmatter
                const fileDate = file.match(/^(\d{4}-\d{2}-\d{2})/);
                if (fileDate) {
                    const frontmatterDate = new Date(frontmatter.date).toISOString().split('T')[0];
                    if (fileDate[1] !== frontmatterDate) {
                        errors.push(`${file}: Filename date (${fileDate[1]}) doesn't match frontmatter date (${frontmatterDate})`);
                    }
                } else {
                    errors.push(`${file}: Invalid filename format - should start with YYYY-MM-DD`);
                }
                
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${file}: ${errorMessage}`);
            }
        }

        if (errors.length > 0) {
            console.error('\nValidation Errors:');
            errors.forEach(error => console.error(`- ${error}`));
            process.exit(1);
        } else {
            console.log('\nAll content files are valid! ✨');
        }
        
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to validate content:', errorMessage);
        process.exit(1);
    }
}

export { validateContentFiles };

validateContentFiles(); 