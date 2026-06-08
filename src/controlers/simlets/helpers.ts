/**
 * Helper function to split search tags from a string into an array of numbers.
 * @param searchTags - A string of comma-separated tags to be split and converted into an array of numbers.
 * @returns An array of numbers representing the search tags, or undefined if the input is not a string or if the resulting array is empty.
 */
export function splitSearchTags(searchTags: any) : Array<number> | undefined {
    let tags: Array<number> | undefined;
    if (typeof searchTags === 'string') {
        tags = searchTags.split(',').map(tag => parseInt(tag.trim()));
    } else if (Array.isArray(searchTags)) {
        tags = searchTags.map(tag => parseInt(tag));
    }
    return tags;
}