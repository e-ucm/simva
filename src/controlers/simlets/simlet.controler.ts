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
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";

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
      case "teacher":
        simlets = await simletService.getSimletsByUserId(currentUser.user_id);
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
 * @param {AuthenticatedRequest} req - Express request object containing simlet ID in URL params
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
    const currentUser = req.user?.sql;
    const simlet_id = parseInt(String(req.params?.id));
    let simlet;
    switch(currentUser?.role) {
      case "admin":
      case "teacher":
        // For teachers, we could add additional permission checking here if needed
        simlet = await simletService.getSimletBySimletIdAndUserId(simlet_id, currentUser!.user_id);
        logger.info({simlet} , "getSimletById results");
        res.json(simlet);
        break;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new simlet in the database.
 * 
 * @async
 * @function createSimlet
 * @param {AuthenticatedRequest} req - Express request object containing simlet data in body
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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    req.body.simlet_coordinator_id = req.user?.sql.user_id;
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
 * @param {AuthenticatedRequest} req - Express request object containing simlet ID in params and update data in body
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
  req: AuthenticatedRequest,
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
 * @param {AuthenticatedRequest} req - Express request object containing simlet ID in URL params
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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.id as string);
    await db.Tables.Simlets.deleteSimlet(simletId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Searches simlets by name or description pattern.
 * 
 * @async
 * @function searchSimlets
 * @param {AuthenticatedRequest} req - Express request object with query parameter 'q' for search term
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
  req: AuthenticatedRequest,
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
      db.Tables.Simlets.searchSimletsByName(searchTerm),
      db.Tables.Simlets.searchSimletsByDescription(searchTerm)
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

export async function getAllocatorFromSimlet(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.id as string);
    logger.info({simletId} , "Getting allocator for simlet ID");
    const allocator = await simletService.getAllocatorFromSimlet(simletId);
    res.json(allocator);
  } catch (err) {
    next(err);
  }
}

export async function getSimletParticipants(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.id as string);
    logger.info({simletId} , "Getting participants for simlet ID");
    const participants = await simletService.getSimletParticipants(simletId);
    logger.info({participants} , "Participants retrieved for simlet ID");
    res.json(participants);
  } catch (err) {
    next(err);
  }
}