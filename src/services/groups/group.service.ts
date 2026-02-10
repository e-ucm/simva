import { Group } from "@/lib/classes/group/Group";
import { Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";
import { db } from "@/lib/db";
import { GroupParticipant } from "@/lib/classes/group/GroupParticipant";
import { logger } from "@/lib/logger";

/**
 * Service for Group entity operations.
 * 
 * @namespace GroupService
 */

/**
 * 
 * @param user_id 
 * @param version
 * @returns 
 */
export async function getGroups(user_id: number, version: boolean = true): Promise<Group[]> {
    let groups = await db.Functions.runViewQuery(db.Views.Group.byVersionAndUserId, {version, user_id});
    return groups.map((groupData: any) => new Group(groupData));
}

export async function getGroup(group_id: number, user_id: number): Promise<Group> {
    let groups = await db.Functions.runViewQuery(db.Views.Group.byGroupIdAndUserId, {group_id, user_id});
    if(groups.length === 0) {
        throw new NotFoundError(`Group with ID ${group_id} not found for user ${user_id}`);
    } else if (groups.length > 1) {
        throw new Error(`Multiple groups found with ID ${group_id} for user ${user_id}`);
    }
    logger.info({ groupData: groups[0] }, `Group data retrieved for group ID ${group_id} and user ID ${user_id}`);
    return new Group(groups[0]);
}

export async function getGroupParticipants(group_id: number): Promise<GroupParticipant[]> {
    let participantsData = await db.Functions.runViewQuery(db.Views.Group.participantsById, {group_id});
    logger.info({ participantsData }, `Group data retrieved for group ID ${group_id}`);
    return participantsData.map((participant: any) => new GroupParticipant(participant));
}