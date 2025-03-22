import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

async function cleanupMDX() {
  try {
    const mdxFiles = await glob('src/content/articles/*.mdx');
    let totalFixed = 0;

    for (const file of mdxFiles) {
      const content = await fs.readFile(file, 'utf8');
      const filename = path.basename(file);

      // Split content into frontmatter and body
      const match = content.match(/^---([\s\S]*?)---([\s\S]*)$/);
      if (!match) {
        console.log(`Skipping ${filename} - no valid frontmatter found`);
        continue;
      }

      let [_, frontmatter, body] = match;

      // Format frontmatter
      const formattedFrontmatter = frontmatter
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .join('\n');

      // Clean up body
      let updatedBody = body
        // Fix malformed MDXImage tags
        .replace(/<MDXImage([^>]*?)(?:>.*?<\/MDXImage>|\/>).*?<MDXImage\1/g, '<MDXImage$1')
        .replace(/<MDXImage([^>]*?)>([^<]*?)<MDXImage/g, '<MDXImage$1>$2</MDXImage><MDXImage')
        // Remove duplicate closing tags
        .replace(/(<\/MDXImage>)+/g, '</MDXImage>')
        // Remove empty MDXImage tags
        .replace(/<MDXImage[^>]*>\s*<\/MDXImage>/g, '')
        // Fix malformed attributes
        .replace(/(\w+)=(\w+)/g, '$1="$2"')
        .replace(/\s+alt=""\s+width=/g, ' alt="" width=')
        // Remove {loading="lazy"} artifacts
        .replace(/\{loading="lazy"\}/g, '')
        // Fix unclosed tags
        .replace(/<([^\/\s>]+)([^>]*)(?<!\/)>([^<]*?)(?!<\/\1>)(<|$)/g, '<$1$2>$3</$1>$4')
        // Fix malformed HTML
        .replace(/(<[^>]+)>/g, (match, p1) => {
          // Ensure there's only one closing bracket
          return p1.replace(/>/g, '') + '>';
        })
        // Remove empty paragraphs
        .replace(/<p>\s*<\/p>/g, '')
        // Fix multiple spaces
        .replace(/\s+/g, ' ')
        // Fix line breaks between tags
        .replace(/>\s+</g, '>\n<')
        // Add line breaks after closing tags
        .replace(/(<\/[^>]+>)(?!\n)/g, '$1\n')
        // Add line breaks before opening tags
        .replace(/(?<!\n)(<[^/][^>]*>)/g, '\n$1')
        // Fix multiple consecutive line breaks
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      // Reconstruct the file
      const updatedContent = `---\n${formattedFrontmatter}\n---\n\n${updatedBody}\n`;

      if (updatedContent !== content) {
        await fs.writeFile(file, updatedContent, 'utf8');
        console.log(`Updated ${filename}`);
        totalFixed++;
      }
    }

    console.log(`\nTotal files fixed: ${totalFixed}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupMDX(); 