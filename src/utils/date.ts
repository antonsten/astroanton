export function formatDate(dateStr: string | Date | undefined) {
    if (!dateStr) {
        console.error('No date string provided');
        return '';
    }
    try {
        const date = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
} 