
/**
 * Creates a short link (shlink) for a specific simlet.
 * 
 * @async
 * @function createShlinkURL
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters and shlink configuration in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // POST /simlets/:simlet_id/shlink
 * // Body: { "url": "https://example.com", "customSlug": "my-simlet" }
 * // Returns: created shlink URL object
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function createShlinkURL(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let simletId = parseInt(req.params.simlet_id as string);
        const access = getAccess(req.user?.sql);
        const response = await simletShlinkService.createShlinkURL(simletId, access.is_admin, access.currentUserId, req.body);
        return res.json(response.toJSON());
    } catch (error) {
        logger.error(error);
        return next(error);
    }
}

/**
 * Retrieves the short link (shlink) for a specific simlet.
 * 
 * @async
 * @function getShlinkURL
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/shlink
 * // Returns: shlink URL object
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getShlinkURL(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let simletId = parseInt(req.params.simlet_id as string);
        const access = getAccess(req.user?.sql);
        const response = await simletShlinkService.getShlinkURL(simletId, access.is_admin, access.currentUserId);
        return res.json(response.toJSON());
    } catch (error) {
        logger.error(error);
        return next(error);
    }
}

/**
 * Updates the short link (shlink) for a specific simlet.
 * 
 * @async
 * @function updateShlinkURL
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters and shlink configuration in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // PUT /simlets/:simlet_id/shlink
 * // Body: { "url": "https://example.com", "customSlug": "updated-simlet" }
 * // Returns: updated shlink URL object
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function updateShlinkURL(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let simletId = parseInt(req.params.simlet_id as string);
        const access = getAccess(req.user?.sql);
        const response = await simletShlinkService.updateShlinkURL(simletId, access.is_admin, access.currentUserId, req.body);
        return res.json(response.toJSON());
    } catch (error) {
        logger.error(error);
        return next(error);
    }
}

/**
 * Deletes the short link (shlink) for a specific simlet.
 * 
 * @async
 * @function deleteShlinkURL
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // DELETE /simlets/:simlet_id/shlink
 * // Returns: 204 No Content on success
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function deleteShlinkURL(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let simletId = parseInt(req.params.simlet_id as string);
        const access = getAccess(req.user?.sql);
        await simletShlinkService.deleteShlinkURL(simletId, access.is_admin, access.currentUserId);
        return res.status(204).send();
    } catch (error) {
        logger.error(error);
        return next(error);
    }
}