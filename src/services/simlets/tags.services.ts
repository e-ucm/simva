import { SessionTag } from "@/lib/mappers/session/SessionTagsElement";
import { SessionTagList } from "@/lib/mappers/session/SessionTagsList";
import { Simlet } from "@/lib/mappers/simlet/Simlet";

/**
 * Retrieves all tags associated with simlets for a specific user.
 * 
 * @async
 * @function getSimletTagsForUser
 * @param {number} current_user_id - The ID of the user requesting tags
 * @returns {Promise<SessionTag[]>} Array of tags associated with the user's simlets
 * 
 * @example
 * ```typescript
 * const tags = await getSimletTagsForUser(123);
 * ```
 */
export async function getSimletTagsForUser(current_user_id: number): Promise<SessionTag[]> {
    const tags = await SessionTag.getTagsForUser(current_user_id);
    return tags;
}


/**
 * Creates a new tag element.
 * 
 * @async
 * @function createTagElement
 * @param {SessionTag} tag - The tag data to create
 * @param {number} current_user_id - The ID of the user creating the tag
 * @returns {Promise<SessionTag>} The newly created tag element
 * 
 * @example
 * ```typescript
 * const tag = await createTagElement({
 *   name: 'Research',
 *   category: 'Subject Area'
 * }, 123);
 * ```
 */
export async function createTagElement(tag: SessionTag, current_user_id: number): Promise<SessionTag> {
    return await SessionTag.create(tag, current_user_id);
}

/**
 * Updates an existing tag element.
 * 
 * @async
 * @function updateTagElement
 * @param {number} tag_id - The ID of the tag to update
 * @param {Partial<SessionTag>} tag - The partial tag data to update
 * @param {number} current_user_id - The ID of the user updating the tag
 * @returns {Promise<SessionTag>} The updated tag element
 * 
 * @example
 * ```typescript
 * const updatedTag = await updateTagElement(456, {
 *   name: 'Advanced Research'
 * }, 123);
 * ```
 */
export async function updateTagElement(tag_id: number, tag: Partial<SessionTag>, current_user_id: number): Promise<SessionTag> {
    let existingTag = await SessionTag.getTag(tag_id, current_user_id);
    await existingTag.update(tag);
    return existingTag;
}

/**
 * Deletes a tag element.
 * 
 * @async
 * @function deleteTagElement
 * @param {number} tag_id - The ID of the tag to delete
 * @param {number} current_user_id - The ID of the user deleting the tag
 * @returns {Promise<void>} No return value on successful deletion
 * 
 * @example
 * ```typescript
 * await deleteTagElement(456, 123);
 * ```
 */
export async function deleteTagElement(tag_id: number, current_user_id: number): Promise<void> {
    await SessionTagList.isTagStillInUse(tag_id);
    let existingTag = await SessionTag.getTag(tag_id, current_user_id);
    await existingTag.delete();
}