/**
 * @fileoverview Service for Simlet entity operations.
 * Handles all CRUD operations and business logic for SIMVA simlets.
 * 
 * A Simlet (Simulation Learning Environment Template) is the top-level learning container
 * that contains sessions and activities for educational research studies.
 * 
 * @module services/simlets/simlet
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 * @requires sequelize
 */

import { db } from "@/lib/db";
import { Simlet } from "@/lib/mappers/simlet/Simlet";
import { logger } from "@/lib/logger";
import { ValidationError } from "@/lib/errors/appErrors";
import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { AllocatorToClass } from "@/lib/mappers/allocators/AllocatorToClass";
import { SimletParticipant } from "@/lib/mappers/simlet/SimletParticipant";
import { SimletGroup } from "@/lib/mappers/simlet/SimletGroup";
import { Session } from "@/lib/mappers/session/Session";
import { Activity } from "@/lib/mappers/activities/Activity";
import { ActivityToClass } from "@/lib/mappers/activities/ActivityToClass";

/**
 * Service for Simlet entity operations.
 * Handles all CRUD operations and business logic for simlets.
 * 
 * @namespace SimletService
 */

/**
 * Retrieves all simlets for a specific user.
 * Uses the v_complete_simlets_users_permissions view to get user's simlets.
 * 
 * @async
 * @function getSimletsByUsername
 * @param {string} username - The username to search for
 * @returns {Promise<Simlet[]>} Array of simlet records with permission information
 * 
 * @example
 * ```typescript
 * const userSimlets = await getSimletsByUsername('john_doe');
 * ```
 */
export async function getSimletsByUserId(user_id: number): Promise<Simlet[]> {
  const results = await db.Functions.runViewQuery(
    db.Views.Simlet.byUserId,
    { user_id }
  );
  logger.debug({results} , "getSimletsByUserId results");
  const processedResults = results.map((simlet: any) => 
    new Simlet(simlet)
  );
  logger.debug({processedResults} , "getSimletsByUserId results");
  return processedResults;
}

/**
 * Retrieves specific simlets for a specific user.
 * Uses the v_complete_simlets_users_permissions view to get user's simlets.
 * 
 * @async
 * @function getSimletBySimletIdAndUserId
 * @param {number} simlet_id - The simlet ID to search for
 * @param {number} user_id - The user ID to search for
 * @returns {Promise<Simlet>} simlet record with permission information
 * 
 * @example
 * ```typescript
 * const userSimlet = await getSimletBySimletIdAndUserId(123, 456);
 * ```
 */
export async function getSimletBySimletIdAndUserId(simlet_id: number, user_id: number): Promise<Simlet> {
  let simlet = await Simlet.getFromDbData(simlet_id, user_id);
  simlet.printInfo(); // Example of using the Simlet class to log info about the first simlet
  return simlet;
}

export async function createSimlet(simletData: any): Promise<Simlet> {
  return await Simlet.createSimlet(simletData);
}

export async function patch(simletId: number, user_id: number, simletData: any): Promise<Simlet> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  return await simlet.patch(simletData);
}

export async function deleteSimlet(simletId: number, user_id: number): Promise<void> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  await simlet.remove();
}

export async function getAllocatorFromSimlet(simletId: number, user_id: number): Promise<Allocator> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  return await simlet.getAllocator();
}

export async function getSimletParticipants(simletId: number, user_id: number): Promise<SimletParticipant[]> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  return await simlet.getAllocatedParticipants();
}

export async function getSimletGroups(simletId: number, user_id: number): Promise<SimletGroup[]> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  return await simlet.getGroups();
}

export async function getSimletSessions(simletId: number, user_id: number): Promise<Session[]> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  return await simlet.getSessions();
}

export async function getSimletSession(simletId: number, sessionId: number, user_id: number): Promise<Session> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  return await simlet.getSession(sessionId);
}

export async function getSessionActivities(simlet_id: number, sessionId: number, user_id: number): Promise<Activity[]> {
  let session = await Session.getFromDbData(simlet_id, sessionId, user_id);
  return await session.getActivities();
}