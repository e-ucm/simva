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
import { Simlet } from "@/lib/classes/simlet/Simlet";
import { logger } from "@/lib/logger";
import { ValidationError } from "@/lib/errors/appErrors";
import { Allocator } from "@/lib/classes/allocators/Allocator";
import { AllocatorToClass } from "@/lib/classes/allocators/AllocatorToClass";
import { SimletParticipant } from "@/lib/classes/simlet/SimletParticipant";
import { SimletGroup } from "@/lib/classes/simlet/SimletGroup";
import { Session } from "@/lib/classes/session/Session";
import { Activity } from "@/lib/classes/activities/Activity";
import { ActivityToClass } from "@/lib/classes/activities/ActivityToClass";

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
  const result = await db.Functions.runViewQuery(
    db.Views.Simlet.byUserIdAndSimletId,
    { user_id, simlet_id }
  );
  logger.debug({result} , "getSimletBySimletIdAndUserId results");
  if(result.length === 0){
    throw new ValidationError(`Simlet with ID ${simlet_id} not found for user ID ${user_id}.`);
  } else if(result.length > 1){
    logger.warn(`Multiple simlets found with ID ${simlet_id} for user ID ${user_id}. Using the first one.`);
  }
  let simlet = new Simlet(result[0]);
  simlet.printInfo(); // Example of using the Simlet class to log info about the first simlet
  return simlet;
}

export async function createSimlet(simletData: any): Promise<Simlet> {
  logger.debug({simletData} , "Creating simlet with data");
  if(await db.Tables.Simlets.count({where : {name : simletData.name}}) > 0){
    throw new ValidationError(`Simlet name ${simletData.name} is already taken. Please choose a different name.`);
  }
  const allocator = await db.Tables.Allocators.create({ allocator_type: simletData.allocator_type || "default" });
  logger.debug({allocator} , "Allocator created");
  simletData.allocator_id = allocator.allocator_id;
  if(simletData.description === undefined){
    simletData.description = "";
  }
  const createdSimlet = await db.Tables.Simlets.create(simletData);
  return new Simlet(createdSimlet);
}

export async function updateSimlet(simletId: number, simletData: any): Promise<Simlet> {
  if(await db.Tables.Simlets.count({where : {name : simletData.name}}) > 0){
    throw new ValidationError(`Simlet name ${simletData.name} is already taken. Please choose a different name.`);
  }
  return new Simlet(await db.Tables.Simlets.updateSimlet(simletId, simletData));
}

export async function deleteSimlet(simletId: number): Promise<void> {
  await db.Tables.Simlets.deleteSimlet(simletId);
}

export async function getAllocatorFromSimlet(simletId: number): Promise<Allocator> {
  const allocator = await db.Functions.runViewQuery(
    db.Views.Simlet.AllocatorBySimletId,
    { simlet_id: simletId }
  );
  logger.debug({allocator} , "Allocator data from view");
  if(allocator.length === 0){
    throw new ValidationError(`No allocator found for simlet ID ${simletId}`);
  } else if(allocator.length > 1){
    logger.warn(`Multiple allocators found for simlet ID ${simletId}. Returning the first one.`);
  }
  return AllocatorToClass(allocator[0]);
}

export async function getSimletParticipants(simletId: number): Promise<SimletParticipant[]> {
  const allocated = await db.Functions.runViewQuery(
    db.Views.Simlet.AllocatedParticipantsBySimletId,
    { simlet_id: simletId }
  );
  logger.debug({allocated} , "Participants data from view");
  return allocated.map((participant: any) => new SimletParticipant(participant));
}

export async function getSimletGroups(simletId: number): Promise<SimletGroup[]> {
  const groups = await db.Functions.runViewQuery(
    db.Views.Simlet.GroupsBySimletId,
    { simlet_id: simletId }
  );
  logger.debug({groups} , "Groups data from view");
  return groups.map((group: any) => new SimletGroup(group));
}

export async function getSimletSessions(simletId: number, userId: number): Promise<Session[]> {
  const sessions = await db.Functions.runViewQuery(
    db.Views.Simlet.SessionsBySimletIdAndUserId,
    { simlet_id: simletId, user_id: userId }
  );
  logger.debug({sessions} , "Sessions data from view");
  return sessions.map((session: any) => new Session(session));
}

export async function getSimletSession(simletId: number, sessionId: number, userId: number): Promise<Session> {
  const session = await db.Functions.runViewQuery(
    db.Views.Simlet.SessionBySimletIdSessionIdAndUserId,
    { session_id: sessionId, user_id: userId, simlet_id: simletId }
  );
  logger.debug({session} , "Session data from view");
  if(session.length === 0){
    throw new ValidationError(`Session with ID ${sessionId} not found.`);
  } else if(session.length > 1){
    logger.warn(`Multiple sessions found with ID ${sessionId}. Using the first one.`);
  }
  return new Session(session[0]);
}

export async function getSessionActivities(sessionId: number, userId: number): Promise<Activity[]> {
  const activities = await db.Functions.runViewQuery(
    db.Views.Activity.bySessionIdUserId,
    { session_id: sessionId, user_id: userId }
  );
  logger.debug({activities} , "Activities data from view");
  return activities.map((activity: any) => ActivityToClass(activity));
}