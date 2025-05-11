/**
 * Validates and normalizes a slug string
 * @param slug The slug to validate and normalize
 * @returns The normalized slug
 * @throws Error if the slug is invalid
 */
export function validateAndNormalizeSlug(slug: string): string {
    if (!slug) {
        throw new Error('Slug cannot be empty');
    }

    // Convert to lowercase and trim
    const normalizedSlug = slug.toLowerCase().trim();

    // Replace multiple consecutive hyphens with a single hyphen
    const cleanedSlug = normalizedSlug.replace(/-+/g, '-');

    // Check if the slug matches our requirements
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(cleanedSlug)) {
        throw new Error('Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens');
    }

    return cleanedSlug;
}

/**
 * Generates a slug from a title string
 * @param title The title to convert to a slug
 * @returns A normalized slug
 */
export function generateSlugFromTitle(title: string): string {
    if (!title) {
        throw new Error('Title cannot be empty');
    }

    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens

    return validateAndNormalizeSlug(slug);
} 