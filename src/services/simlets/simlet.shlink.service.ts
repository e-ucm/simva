
import { Simlet } from "@/lib/mappers/simlet/Simlet";
import { SimletShlink } from "@/lib/mappers/simlet/SimletShlink";

/**
 * Creates a new shlink URL for a simlet.
 * 
 * @async
 * @function createShlinkURL
 * @param {number} simletId - The ID of the simlet
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} current_user_id - The ID of the user creating the shlink
 * @param {any} shlink - The shlink configuration data
 * @returns {Promise<SimletShlink>} The newly created shlink URL object
 * 
 * @example
 * ```typescript
 * const shlink = await createShlinkURL(123, false, 456, {
 *   url: 'https://example.com/simlet-123'
 * });
 * ```
 */
export async function createShlinkURL(simletId: number, is_admin: boolean, current_user_id: number, shlink: any): Promise<SimletShlink> {
    let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
    return await simlet.createShlinkURL(shlink);
}

/**
 * Retrieves the shlink URL for a simlet.
 * 
 * @async
 * @function getShlinkURL
 * @param {number} simletId - The ID of the simlet
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} current_user_id - The ID of the user requesting the shlink
 * @returns {Promise<SimletShlink>} The shlink URL object
 * 
 * @example
 * ```typescript
 * const shlink = await getShlinkURL(123, false, 456);
 * ```
 */
export async function getShlinkURL(simletId: number, is_admin: boolean, current_user_id: number): Promise<SimletShlink> {
    let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
    return await simlet.getShlinkURL();
}


/**
 * Updates the shlink URL for a simlet.
 * 
 * @async
 * @function updateShlinkURL
 * @param {number} simletId - The ID of the simlet
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} current_user_id - The ID of the user updating the shlink
 * @param {any} shlink - The updated shlink configuration data
 * @returns {Promise<SimletShlink>} The updated shlink URL object
 * 
 * @example
 * ```typescript
 * const shlink = await updateShlinkURL(123, false, 456, {
 *   url: 'https://example.com/simlet-456'
 * });
 * ```
 */
export async function updateShlinkURL(simletId: number, is_admin: boolean, current_user_id: number, shlink: any): Promise<SimletShlink> {
    let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
    return await simlet.updateShlinkURL(shlink);
}

/**
 * Deletes the shlink URL for a simlet.
 * 
 * @async
 * @function deleteShlinkURL
 * @param {number} simletId - The ID of the simlet
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} current_user_id - The ID of the user deleting the shlink
 * @returns {Promise<void>} No return value on successful deletion
 * 
 * @example
 * ```typescript
 * await deleteShlinkURL(123, false, 456);
 * ```
 */
export async function deleteShlinkURL(simletId: number, is_admin: boolean, current_user_id: number): Promise<void> {
    let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
    await simlet.deleteShlinkURL();
}