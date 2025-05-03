export function formatDate(dateStr: string | Date | undefined) {
    if (!dateStr) {
        console.error('No date string provided');
        return '';
    }
    try {
        const date = new Date(dateStr);
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
} 