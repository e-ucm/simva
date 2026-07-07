
/**
 * Retrieves xAPI statements for a specific activity.
 * 
 * @async
 * @function getStatementsLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /activities/:activity_id/lrs/statements
 * // Returns array of xAPI statements
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const statements = await activitiesLRSService.getStatementsLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(statements); 
    } catch (err) {
        next(err);
    }
}

/**
 * Retrieves test xAPI statements for a specific activity.
 * 
 * @async
 * @function getTestStatementsLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /activities/:activity_id/lrs_test_statements
 * // Returns array of test xAPI statements
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getTestStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const statements = await activitiesLRSService.getTestStatementsLRSForActivity(access.currentUserId as number, currentUser?.username!, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(statements); 
    } catch (err) {
        next(err);
    }
}

/**
 * Retrieves additional xAPI statements for a specific activity using a continuation token.
 * 
 * @async
 * @function getMoreStatementsLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and 'more' query parameter
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid or 'more' parameter is missing
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /activities/:activity_id/lrs/more?more=token
 * // Returns additional xAPI statements using continuation token
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getMoreStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const moreStatements = req.query.more as string;
        if(!moreStatements) {
            throw new BadRequestError("Invalid query parameter 'more'");
        }
        const statements = await activitiesLRSService.getMoreStatementsLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, moreStatements);
        return res.status(200).json(statements);
    } catch (err) {
        next(err);
    }
}

/**
 * Posts xAPI statements to a specific activity.
 * 
 * @async
 * @function postStatementsLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and array of xAPI statements in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid or request body is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /activities/:activity_id/lrs/statements
 * // Body: [{"id":"1","actor":{},"verb":{},"object":{}}]
 * // Returns: 201 Created with array of statement IDs
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function postStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        let body = req.body;
        if(!body || typeof body !== "object") {
            throw new BadRequestError("Invalid request body");
        }
        const access = getAccess(currentUser);
        let ids: number[] = [];
        if (access.is_admin) {
            ids = await activitiesLRSService.sendStatementsLRSForActivity(access.currentUserId, access.is_admin, access.allocated, activityId, body, access.currentUserId);
        } else if (access.canImpersonate) {
            if(body && body.length > 0 && typeof body[0] === "object") {
                const postuserId = (await User.getFromDbData(undefined, body[0].actor.account.name)).user_id;
                if(isNaN(postuserId)) {
                    throw new ValidationError("Invalid username in query parameter");
                }
                ids = await activitiesLRSService.sendStatementsLRSForActivity(postuserId, false, true, activityId, body, access.currentUserId);
            } else {
                throw new ValidationError("Invalid request body for lrsmanager role");
            }
        } else {
            ids = await activitiesLRSService.sendStatementsLRSForActivity(access.currentUserId, access.is_admin, true, activityId, body, access.currentUserId);
        }
        return res.status(201).json(ids);
    } catch (err) {
        next(err);
    }
}

/**
 * Updates xAPI statements for a specific activity.
 * 
 * @async
 * @function putStatementsLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and array of xAPI statements in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid or request body is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PUT /activities/:activity_id/lrs/statements
 * // Body: [{"id":"1","actor":{},"verb":{},"object":{}}]
 * // Returns: 201 Created with array of statement IDs
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function putStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        let body = req.body;
        if(!body || typeof body !== "object") {
            throw new BadRequestError("Invalid request body");
        }
        const access = getAccess(currentUser);
        let ids: number[] = [];
        if (access.is_admin) {
            ids = await activitiesLRSService.sendStatementsLRSForActivity(access.currentUserId, access.is_admin, access.allocated, activityId, body, access.currentUserId);
        } else if (access.canImpersonate) {
            if(body && body.length > 0 && typeof body[0] === "object") {
                const postuserId = (await User.getFromDbData(undefined, body[0].actor.account.name)).user_id;
                if(isNaN(postuserId)) {
                    throw new ValidationError("Invalid username in query parameter");
                }
                ids = await activitiesLRSService.sendStatementsLRSForActivity(postuserId, false, true, activityId, body, access.currentUserId);
            } else {
                throw new ValidationError("Invalid request body for lrsmanager role");
            }
        } else {
            ids = await activitiesLRSService.sendStatementsLRSForActivity(access.currentUserId, access.is_admin, true, activityId, body, access.currentUserId);
        }
        return res.status(201).json(ids);
    } catch (err) {
        next(err);
    }
}

/**
 * Retrieves agents associated with xAPI statements for a specific activity.
 * 
 * @async
 * @function getAgentsLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /activities/:activity_id/lrs/agents
 * // Returns array of agent objects
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getAgentsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const agents = await activitiesLRSService.getAgentsLRSForActivity(access.currentUserId as number, access.is_admin,  access.allocated,activityId, req.query);
        return res.status(200).json(agents);
    } catch (err) {
        next(err);
    }
}

/**
 * Retrieves agent profiles for xAPI statements associated with a specific activity.
 * 
 * @async
 * @function getAgentsProfileLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /activities/:activity_id/lrs/agents/profile
 * // Returns array of agent profile objects
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const agentsProfile = await activitiesLRSService.getAgentsProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(agentsProfile);
    } catch (err) {
        next(err);
    }
}

/**
 * Posts agent profiles for xAPI statements associated with a specific activity.
 * 
 * @async
 * @function postAgentsProfileLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and agent profile data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid or request body is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /activities/:activity_id/lrs/agents/profile
 * // Body: {"mbox":"mailto:example@example.com","name":"Example User"}
 * // Returns: 204 No Content on success
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function postAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        let body = req.body;
        if(!body || typeof body !== "object") {
            throw new BadRequestError("Invalid request body");
        }
        const access = getAccess(currentUser);
        await activitiesLRSService.postAgentsProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, body);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

/**
 * Updates agent profiles for xAPI statements associated with a specific activity.
 * 
 * @async
 * @function updateAgentsProfileLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and agent profile data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid or request body is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PUT /activities/:activity_id/lrs/agents/profile
 * // Body: {"mbox":"mailto:example@example.com","name":"Updated Name"}
 * // Returns: 204 No Content on success
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function updateAgentsProfileLRSForActivity(req: AuthenticatedRequest, res:  Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        let body = req.body;
        if(!body || typeof body !== "object") {
            throw new BadRequestError("Invalid request body");
        }
        const access = getAccess(currentUser);
        await activitiesLRSService.updateAgentsProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, body);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

/**
 * Deletes agent profiles for xAPI statements associated with a specific activity.
 * 
 * @async
 * @function deleteAgentsProfileLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // DELETE /activities/:activity_id/lrs/agents/profile
 * // Returns: 204 No Content on success
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function deleteAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        await activitiesLRSService.deleteAgentsProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

/**
 * Retrieves activities associated with xAPI statements for a specific activity.
 * 
 * @async
 * @function getActivitiesLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /activities/:activity_id/lrs/activities
 * // Returns array of activity objects
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getActivitiesLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.getActivitiesLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

/**
 * Retrieves activity profiles for xAPI statements associated with a specific activity.
 * 
 * @async
 * @function getActivitiesProfileLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /activities/:activity_id/lrs/activities/profile
 * // Returns array of activity profile objects
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.getActivitiesProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

/**
 * Posts activity profiles for xAPI statements associated with a specific activity.
 * 
 * @async
 * @function postActivitiesProfileLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and activity profile data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid or request body is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /activities/:activity_id/lrs/activities/profile
 * // Body: {"id":"http://example.com/activity","name":"Example Activity"}
 * // Returns: 201 Created with created activity profile
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function postActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.postActivitiesProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body);
        return res.status(201).json(activities);
    } catch (err) {
        next(err);
    }
}

/**
 * Updates activity profiles for xAPI statements associated with a specific activity.
 * 
 * @async
 * @function updateActivitiesProfileLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and activity profile data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid or request body is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PUT /activities/:activity_id/lrs/activities/profile
 * // Body: {"id":"http://example.com/activity","name":"Updated Name"}
 * // Returns: 200 OK with updated activity profile
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function updateActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.updateActivitiesProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

/**
 * Deletes activity profiles for xAPI statements associated with a specific activity.
 * 
 * @async
 * @function deleteActivitiesProfileLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // DELETE /activities/:activity_id/lrs/activities/profile
 * // Returns: 204 No Content on success
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function deleteActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.deleteActivitiesProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

/**
 * Retrieves activity states for xAPI statements associated with a specific activity.
 * 
 * @async
 * @function getActivitiesStateLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /activities/:activity_id/lrs/activities/state
 * // Returns array of activity state objects
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.getActivitiesStateLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

/**
 * Posts activity states for xAPI statements associated with a specific activity.
 * Requires admin or impersonation privileges.
 * 
 * @async
 * @function postActivitiesStateLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and activity state data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid or request body is invalid
 * @throws {AuthentificationError} If user lacks sufficient permissions
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /activities/:activity_id/lrs/activities/state
 * // Body: {"stateId":"1","content":"{\"key\":\"value\"}"}
 * // Returns: 201 Created with created activity state
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function postActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        if (!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("You don't have the right to access this resource");
        }
        const activities = await activitiesLRSService.postActivitiesStateLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body);
        return res.status(201).json(activities);
    } catch (err) {
        next(err);
    }   
}

/**
 * Updates activity states for xAPI statements associated with a specific activity.
 * Requires admin or impersonation privileges.
 * 
 * @async
 * @function updateActivitiesStateLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and activity state data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid or request body is invalid
 * @throws {AuthentificationError} If user lacks sufficient permissions
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PUT /activities/:activity_id/lrs/activities/state
 * // Body: {"stateId":"1","content":"{\"key\":\"updated_value\"}"}
 * // Returns: 200 OK with updated activity state
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function updateActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        if (!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("You don't have the right to access this resource");
        }
        const activities = await activitiesLRSService.updateActivitiesStateLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

/**
 * Deletes activity states for xAPI statements associated with a specific activity.
 * Requires admin or impersonation privileges.
 * 
 * @async
 * @function deleteActivitiesStateLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {AuthentificationError} If user lacks sufficient permissions
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // DELETE /activities/:activity_id/lrs/activities/state
 * // Returns: 204 No Content on success
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function deleteActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        if (!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("You don't have the right to access this resource");
        }
        const activities = await activitiesLRSService.deleteActivitiesStateLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

/**
 * Retrieves activity information (about) for xAPI statements associated with a specific activity.
 * 
 * @async
 * @function getAboutLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /activities/:activity_id/lrs/about
 * // Returns activity information object
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getAboutLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.getAboutLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

/**
 * Retrieves a specific extension for xAPI statements associated with a specific activity.
 * 
 * @async
 * @function getExtensionLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id and extension_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /activities/:activity_id/lrs/extensions/:extension_id
 * // Returns extension data object
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
 export async function getExtensionLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.getExtensionLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.params.extension_id as string);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

/**
 * Updates agent profiles for xAPI statements associated with a specific activity.
 * Requires admin or impersonation privileges.
 * 
 * @async
 * @function putAgentsProfileLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and agent profile data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid or request body is invalid
 * @throws {AuthentificationError} If user lacks sufficient permissions
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PUT /activities/:activity_id/lrs/agents/profile
 * // Body: {"mbox":"mailto:example@example.com","name":"Updated Name"}
 * // Returns: 200 OK with updated agent profile
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function putAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        if (!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("You don't have the right to access this resource");
        }
        const activities = await activitiesLRSService.putAgentsProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body, access.currentUserId as number);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

/**
 * Updates activity profiles for xAPI statements associated with a specific activity.
 * Requires admin or impersonation privileges.
 * 
 * @async
 * @function putActivitiesProfileLRSForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters and activity profile data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If activity ID is invalid or request body is invalid
 * @throws {AuthentificationError} If user lacks sufficient permissions
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PUT /activities/:activity_id/lrs/activities/profile
 * // Body: {"id":"http://example.com/activity","name":"Updated Name"}
 * // Returns: 200 OK with updated activity profile
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function putActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        if (!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("You don't have the right to access this resource");
        }
        const activities = await activitiesLRSService.putActivitiesProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body, access.currentUserId as number);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}