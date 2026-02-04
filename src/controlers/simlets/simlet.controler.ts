/**
 * @fileoverview Controller for simlet entity operations.
 * Handles HTTP requests and responses for SIMVA simlet management endpoints.
 * 
 * A Simlet (Simulation Learning Environment Template) is the top-level learning container
 * that contains sessions and activities for educational research studies.
 * 
 * @module controllers/simlets/simlet
 * @requires @/services/simlets/simlet.service
 * @requires @/lib/errors/appErrors
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { Request, Response, NextFunction } from "express";
import * as simletService from "@/services/simlets/simlet.service";
import { NotFoundError, AuthentificationError } from "@/lib/errors/appErrors";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";
import { getSimletsByUsername } from "@/services/views/views.service";
/**
 * Retrieves simlets from the database.
 * Supports pagination via query parameters and optional filtering by coordinator.
 * 
 * @async
 * @function getAllSimlets
 * @param {AuthenticatedRequest} req - Express request object with optional query parameters (limit, offset, coordinator)
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /simlets
 * // Returns all simlets
 * 
 * @example
 * // GET /simlets?limit=10&offset=20
 * // Returns paginated simlets
 * 
 * @example
 * // GET /simlets
 * // Returns simlets
 */
export async function getAllSimlets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const currentUser = req.user?.sql;
    let simlets;
    switch(currentUser?.role) {
      case "admin":
        const limit = req.query.limit ? parseInt(String(req.query.limit)) : undefined;
        const offset = req.query.offset ? parseInt(String(req.query.offset)) : undefined;
        simlets = await simletService.getAllSimlets(limit, offset);
        res.json(simlets);
        break;
    case "teacher":
        simlets = await getSimletsByUsername(currentUser.username || "");
        res.json(simlets);
        break;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves a single simlet by ID.
 * 
 * @async
 * @function getSimletById
 * @param {Request} req - Express request object containing simlet ID in URL params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If simlet with the specified ID doesn't exist
 * 
 * @example
 * // GET /simlets/123
 * // Returns simlet with ID 123
 */
export async function getSimletById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(String(req.params?.id));
    const simlet = await simletService.getSimletById(simletId);
    res.json(simlet);
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new simlet in the database.
 * 
 * @async
 * @function createSimlet
 * @param {Request} req - Express request object containing simlet data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes validation or database errors to next middleware
 * 
 * @example
 * // POST /simlets
 * // Body: { 
 * //   name: "Mathematics Learning Environment",
 * //   description: "Interactive mathematics simulation",
 * //   allocator_id: 1,
 * //   simlet_coordinator_id: 123
 * // }
 * // Returns: 201 Created with simlet object
 */
export async function createSimlet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simlet = await simletService.createSimlet(req.body);
    res.status(201).json(simlet);
  } catch (err) {
    next(err);
  }
}

/**
 * Updates an existing simlet by ID.
 * 
 * @async
 * @function updateSimlet
 * @param {Request} req - Express request object containing simlet ID in params and update data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If simlet with the specified ID doesn't exist
 * 
 * @example
 * // PUT /simlets/123
 * // Body: { name: "Updated Simlet Name", description: "Updated description" }
 * // Returns: 200 OK with updated simlet object
 */
export async function updateSimlet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.id as string);
    const simlet = await simletService.updateSimlet(simletId, req.body);
    res.json(simlet);
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a simlet from the database by ID.
 * 
 * @async
 * @function deleteSimlet
 * @param {Request} req - Express request object containing simlet ID in URL params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If simlet with the specified ID doesn't exist
 * 
 * @example
 * // DELETE /simlets/123
 * // Returns: 204 No Content
 */
export async function deleteSimlet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.id as string);
    await simletService.deleteSimlet(simletId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves the count of all simlets or by specific filters.
 * 
 * @async
 * @function getSimletsCount
 * @param {Request} req - Express request object with optional query parameters (coordinator, allocator)
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /simlets/count
 * // Returns: { count: 42 }
 * 
 * @example
 * // GET /simlets/count?coordinator=123
 * // Returns: { count: 5 }
 */
export async function getSimletsCount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const coordinator = req.query.coordinator ? parseInt(String(req.query.coordinator)) : undefined;
    const allocator = req.query.allocator ? parseInt(String(req.query.allocator)) : undefined;

    let count;
    if (coordinator) {
      count = await simletService.countSimletsByCoordinator(coordinator);
    } else if (allocator) {
      count = await simletService.countSimletsByAllocator(allocator);
    } else {
      count = await simletService.countSimlets();
    }

    res.json({ count });
  } catch (err) {
    next(err);
  }
}

/**
 * Searches simlets by name or description pattern.
 * 
 * @async
 * @function searchSimlets
 * @param {Request} req - Express request object with query parameter 'q' for search term
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /simlets/search?q=mathematics
 * // Returns simlets matching 'mathematics' in name or description
 */
export async function searchSimlets(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const searchTerm = String(req.query.q || '');
    
    if (!searchTerm) {
      res.json([]);
      return;
    }

    const [nameResults, descriptionResults] = await Promise.all([
      simletService.searchSimletsByName(searchTerm),
      simletService.searchSimletsByDescription(searchTerm)
    ]);

    // Combine and deduplicate results
    const combinedResults = [...nameResults];
    const existingIds = new Set(nameResults.map(s => s.simlet_id));
    
    for (const result of descriptionResults) {
      if (!existingIds.has(result.simlet_id)) {
        combinedResults.push(result);
      }
    }

    res.json(combinedResults);
  } catch (err) {
    next(err);
  }
}

/**
 * Checks if a simlet exists by ID.
 * 
 * @async
 * @function checkSimletExists
 * @param {Request} req - Express request object containing simlet ID in URL params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /simlets/123/exists
 * // Returns: { exists: true }
 */
export async function checkSimletExists(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.id as string);
    const exists = await simletService.simletExists(simletId);
    res.json({ exists });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets simlets that have sandbox sessions.
 * 
 * @async
 * @function getSimletsWithSandbox
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /simlets/sandbox
 * // Returns array of simlets with sandbox sessions
 */
export async function getSimletsWithSandbox(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simlets = await simletService.getSimletsWithSandbox();
    res.json(simlets);
  } catch (err) {
    next(err);
  }
}

/**
 * Gets current user's simlets (simlets they coordinate).
 * Requires authentication.
 * 
 * @async
 * @function getMySimlets
 * @param {AuthenticatedRequest} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user is not authenticated
 * 
 * @example
 * // GET /simlets/me
 * // Returns array of simlets coordinated by the current user
 */
export async function getMySimlets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.sql?.user_id;
    if (!userId) {
      throw new AuthentificationError("User not authenticated");
    }

    const simlets = await simletService.getSimletsByCoordinator(userId);
    res.json(simlets);
  } catch (err) {
    next(err);
  }
}