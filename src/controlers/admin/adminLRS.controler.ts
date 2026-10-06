import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { NextFunction, Response } from "express";
import { AuthentificationError, BadRequestError } from "@/lib/errors/appErrors";
import { getAccess } from "@/controlers/users/user.helper";
import * as adminLRSService from "@/services/admin/adminLRS.service";

/**
 * Retrieves xAPI statements from the whole LRS without activity scoping.
 *
 * @async
 * @function getStatements
 * @param {AuthenticatedRequest} req - Express request object with LRS query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If the user role is not allowed to access all the statements
 * @throws {Error} Passes other errors to next middleware
 *
 * @example
 * // GET /admin/lrs/statements
 * // Returns the statements of all the activities
 *
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getStatements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const currentUser = req.user?.sql;
        const access = getAccess(currentUser);
        if(!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("User role not allowed to access all the LRS statements");
        }
        const statements = await adminLRSService.getStatements(req.query);
        return res.status(200).json(statements);
    } catch (err) {
        next(err);
    }
}

/**
 * Retrieves additional xAPI statements from the whole LRS using a continuation token.
 *
 * @async
 * @function getMoreStatements
 * @param {AuthenticatedRequest} req - Express request object with the 'more' query parameter
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If the 'more' parameter is missing
 * @throws {AuthentificationError} If the user role is not allowed to access all the statements
 * @throws {Error} Passes other errors to next middleware
 *
 * @example
 * // GET /admin/lrs/statements/more?more=token
 * // Returns the next batch of statements
 *
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getMoreStatements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const currentUser = req.user?.sql;
        const access = getAccess(currentUser);
        if(!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("User role not allowed to access all the LRS statements");
        }
        const more = req.query.more as string;
        if(!more) {
            throw new BadRequestError("Invalid query parameter 'more'");
        }
        const statements = await adminLRSService.getMoreStatements(more);
        return res.status(200).json(statements);
    } catch (err) {
        next(err);
    }
}

/**
 * Posts xAPI statements to the whole LRS without activity scoping.
 *
 * @async
 * @function postStatements
 * @param {AuthenticatedRequest} req - Express request object with the xAPI statements in the body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {BadRequestError} If the request body is invalid
 * @throws {AuthentificationError} If the user role is not allowed to post to all the statements
 * @throws {Error} Passes other errors to next middleware
 *
 * @example
 * // POST /admin/lrs/statements
 * // Body: [{"id":"1","actor":{},"verb":{},"object":{}}]
 * // Returns: 201 Created with array of statement IDs
 *
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function postStatements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const currentUser = req.user?.sql;
        const access = getAccess(currentUser);
        if(!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("User role not allowed to post all the LRS statements");
        }
        const body = req.body;
        if(!body || typeof body !== "object") {
            throw new BadRequestError("Invalid request body");
        }
        const ids = await adminLRSService.sendStatements(body);
        return res.status(201).json(ids);
    } catch (err) {
        next(err);
    }
}