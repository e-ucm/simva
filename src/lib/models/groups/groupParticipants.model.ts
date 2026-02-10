/**
 * @fileoverview GroupParticipants model for SIMVA API.
 * Represents the many-to-many relationship between groups and participants.
 * 
 * @module models/groups/groupParticipants
 */

import { NotFoundError } from "@/lib/errors/appErrors";
import { Sequelize, Model } from "sequelize";

/**
 * GroupParticipants model representing the junction table between groups and participants.
 * Manages the many-to-many relationship between groups and users.
 * 
 * @class GroupParticipants
 * @extends Model
 * 
 * @property {number} group_id - Foreign key to the group (composite primary key)
 * @property {number} participant_id - Foreign key to the participant/user (composite primary key)
 */
export class GroupParticipants extends Model {
  declare group_id: number;
  declare participant_id: number;
  
  /**
   * Retrieve all group participants from the database.
   * 
   * @async
   * @function getAllGroupParticipants
   * @returns {Promise<GroupParticipants[]>} Array of all group participants
   * 
   * @example
   * ```typescript
   * const participants = await getAllGroupParticipants();
   * ```
   */
  static async getAllGroupParticipants(): Promise<GroupParticipants[]> {
    return await GroupParticipants.findAll({
      order: [['group_id', 'ASC'], ['participant_id', 'ASC']]
    });
  }

  /**
   * Retrieve a group participant by group and participant ID.
   * 
   * @async
   * @function getGroupParticipantById
   * @param {number} group_id - The group's ID
   * @param {number} participant_id - The participant's ID
   * @returns {Promise<GroupParticipants>} The group participant object
   * @throws {NotFoundError} If participant not found in group
   * 
   * @example
   * ```typescript
   * const participant = await getGroupParticipantById(123, 456);
   * ```
   */
  static async getGroupParticipantById(group_id: number, participant_id: number): Promise<GroupParticipants> {
    const participant = await GroupParticipants.findOne({
      where: { group_id, participant_id }
    });
    
    if (!participant) {
      throw new NotFoundError(`Participant ${participant_id} not found in group ${group_id}`);
    }
    
    return participant;
  }

  /**
   * Retrieve all participants in a specific group.
   * 
   * @async
   * @function getParticipantsByGroup
   * @param {number} group_id - The group's ID
   * @returns {Promise<GroupParticipants[]>} Array of participant records for the group
   * 
   * @example
   * ```typescript
   * const participants = await getParticipantsByGroup(123);
   * ```
   */
  static async getParticipantsByGroup(group_id: number): Promise<GroupParticipants[]> {
    return await GroupParticipants.findAll({
      where: { group_id },
      order: [['participant_id', 'ASC']]
    });
  }

  /**
   * Retrieve all groups where a user is a participant.
   * 
   * @async
   * @function getGroupsByParticipant
   * @param {number} participant_id - The participant's user ID
   * @returns {Promise<GroupParticipants[]>} Array of group records where user is a participant
   * 
   * @example
   * ```typescript
   * const groups = await getGroupsByParticipant(456);
   * ```
   */
  static async getGroupsByParticipant(participant_id: number): Promise<GroupParticipants[]> {
    return await GroupParticipants.findAll({
      where: { participant_id },
      order: [['group_id', 'ASC']]
    });
  }

  /**
   * Check if a user is a participant in a specific group.
   * 
   * @async
   * @function isParticipant
   * @param {number} group_id - The group's ID
   * @param {number} participant_id - The participant's user ID
   * @returns {Promise<boolean>} True if user is a participant, false otherwise
   * 
   * @example
   * ```typescript
   * const isParticipant = await isParticipant(123, 456);
   * ```
   */
  static async isParticipant(group_id: number, participant_id: number): Promise<boolean> {
    const count = await GroupParticipants.count({
      where: { group_id, participant_id }
    });
    return count > 0;
  }

  /**
   * Add a participant to a group.
   * 
   * @async
   * @function addParticipant
   * @param {number} group_id - The group's ID
   * @param {number} participant_id - The participant's user ID
   * @returns {Promise<GroupParticipants>} The created participant record
   * 
   * @example
   * ```typescript
   * const participant = await addParticipant(123, 456);
   * ```
   */
  static async addParticipant(
    group_id: number, 
    participant_id: number
  ): Promise<GroupParticipants> {
    return await GroupParticipants.create({ group_id, participant_id });
  }

  /**
   * Create a group participant (alias for addParticipant).
   * 
   * @async
   * @function createGroupParticipant
   * @param {Partial<GroupParticipants>} participantData - The participant data
   * @returns {Promise<GroupParticipants>} The created participant record
   * 
   * @example
   * ```typescript
   * const participant = await createGroupParticipant({
   *   group_id: 123,
   *   participant_id: 456
   * });
   * ```
   */
  static async createGroupParticipant(participantData: Partial<GroupParticipants>): Promise<GroupParticipants> {
    return await GroupParticipants.create(participantData);
  }

  /**
   * Update a group participant (no-op since there are no updateable fields).
   * 
   * @async
   * @function updateGroupParticipant
   * @param {number} group_id - The group's ID
   * @param {number} participant_id - The participant's ID
   * @param {Partial<GroupParticipants>} updateData - The data to update (ignored)
   * @returns {Promise<GroupParticipants>} The participant record
   * 
   * @example
   * ```typescript
   * const participant = await updateGroupParticipant(123, 456, {});
   * ```
   */
  static async updateGroupParticipant(
    group_id: number,
    participant_id: number,
    updateData: Partial<GroupParticipants>
  ): Promise<GroupParticipants> {
    let participant = await GroupParticipants.getGroupParticipantById(group_id, participant_id);
    // No updateable fields, so just return the existing record
    return participant;
  }

  /**
   * Remove a participant from a group.
   * 
   * @async
   * @function removeParticipant
   * @param {number} group_id - The group's ID
   * @param {number} participant_id - The participant's user ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If the participant record doesn't exist
   * 
   * @example
   * ```typescript
   * await removeParticipant(123, 456);
   * ```
   */
  static async removeParticipant(
    group_id: number, 
    participant_id: number
  ): Promise<void> {
    const deleted = await GroupParticipants.destroy({
      where: { group_id, participant_id }
    });
    
    if (deleted === 0) {
      throw new NotFoundError(
        `Participant ${participant_id} not found in group ${group_id}`
      );
    }
  }

  /**
   * Remove all participants from a group (when deleting a group).
   * 
   * @async
   * @function removeAllParticipants
   * @param {number} group_id - The group's ID
   * @returns {Promise<number>} Number of participants removed
   * 
   * @example
   * ```typescript
   * const removed = await removeAllParticipants(123);
   * ```
   */
  static async removeAllParticipants(group_id: number): Promise<number> {
    return await GroupParticipants.destroy({
      where: { group_id }
    });
  }

  /**
   * Remove a user from all groups (when deleting a user).
   * 
   * @async
   * @function removeParticipantFromAllGroups
   * @param {number} participant_id - The participant's user ID
   * @returns {Promise<number>} Number of group memberships removed
   * 
   * @example
   * ```typescript
   * const removed = await removeParticipantFromAllGroups(456);
   * ```
   */
  static async removeParticipantFromAllGroups(participant_id: number): Promise<number> {
    return await GroupParticipants.destroy({
      where: { participant_id }
    });
  }

  /**
   * Get all participant IDs for a group.
   * 
   * @async
   * @function getParticipantIds
   * @param {number} group_id - The group's ID
   * @returns {Promise<number[]>} Array of participant user IDs
   * 
   * @example
   * ```typescript
   * const participantIds = await getParticipantIds(123);
   * ```
   */
  static async getParticipantIds(group_id: number): Promise<number[]> {
    const records = await GroupParticipants.findAll({
      where: { group_id },
      attributes: ['participant_id'],
      order: [['participant_id', 'ASC']]
    });
    
    return records.map(record => record.participant_id);
  }

  /**
   * Get all group IDs where a user is a participant.
   * 
   * @async
   * @function getGroupIds
   * @param {number} participant_id - The participant's user ID
   * @returns {Promise<number[]>} Array of group IDs
   * 
   * @example
   * ```typescript
   * const groupIds = await getGroupIds(456);
   * ```
   */
  static async getGroupIds(participant_id: number): Promise<number[]> {
    const records = await GroupParticipants.findAll({
      where: { participant_id },
      attributes: ['group_id'],
      order: [['group_id', 'ASC']]
    });
    
    return records.map(record => record.group_id);
  }

  /**
   * Count total participants in a group.
   * 
   * @async
   * @function countParticipants
   * @param {number} group_id - The group's ID
   * @returns {Promise<number>} Number of participants in the group
   * 
   * @example
   * ```typescript
   * const count = await countParticipants(123);
   * ```
   */
  static async countParticipants(group_id: number): Promise<number> {
    return await GroupParticipants.count({
      where: { group_id }
    });
  }

  /**
   * Count total groups where a user is a participant.
   * 
   * @async
   * @function countUserGroups
   * @param {number} participant_id - The participant's user ID
   * @returns {Promise<number>} Number of groups where user is a participant
   * 
   * @example
   * ```typescript
   * const count = await countUserGroups(456);
   * ```
   */
  static async countUserGroups(participant_id: number): Promise<number> {
    return await GroupParticipants.count({
      where: { participant_id }
    });
  }

  /**
   * Delete a group participant.
   * 
   * @async
   * @function deleteGroupParticipant
   * @param {number} group_id - The group's ID
   * @param {number} participant_id - The participant's ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If participant not found in group
   * 
   * @example
   * ```typescript
   * await deleteGroupParticipant(123, 456);
   * ```
   */
  static async deleteGroupParticipant(group_id: number, participant_id: number): Promise<void> {
    const participant = await GroupParticipants.getGroupParticipantById(group_id, participant_id);
    await participant.destroy();
  }

  /**
   * Delete all participants from a group.
   * 
   * @async
   * @function deleteParticipantsByGroup
   * @param {number} group_id - The group's ID
   * @returns {Promise<number>} Number of participants removed
   * 
   * @example
   * ```typescript
   * const count = await deleteParticipantsByGroup(123);
   * ```
   */
  static async deleteParticipantsByGroup(group_id: number): Promise<number> {
    return await GroupParticipants.destroy({
      where: { group_id }
    });
  }

  /**
   * Delete a user from all groups.
   * 
   * @async
   * @function deleteParticipantsByUser
   * @param {number} participant_id - The participant's user ID
   * @returns {Promise<number>} Number of group memberships removed
   * 
   * @example
   * ```typescript
   * const count = await deleteParticipantsByUser(456);
   * ```
   */
  static async deleteParticipantsByUser(participant_id: number): Promise<number> {
    return await GroupParticipants.destroy({
      where: { participant_id }
    });
  }

  /**
   * Count total group participants.
   * 
   * @async
   * @function countGroupParticipants
   * @returns {Promise<number>} Total count of all group participants
   * 
   * @example
   * ```typescript
   * const count = await countGroupParticipants();
   * ```
   */
  static async countGroupParticipants(): Promise<number> {
    return await GroupParticipants.count();
  }

  /**
   * Count participants by group.
   * 
   * @async
   * @function countParticipantsByGroup
   * @param {number} group_id - The group's ID
   * @returns {Promise<number>} Count of participants in the group
   * 
   * @example
   * ```typescript
   * const count = await countParticipantsByGroup(123);
   * ```
   */
  static async countParticipantsByGroup(group_id: number): Promise<number> {
    return await GroupParticipants.count({ where: { group_id } });
  }

  /**
   * Count participants by user.
   * 
   * @async
   * @function countParticipantsByUser
   * @param {number} participant_id - The participant's user ID
   * @returns {Promise<number>} Count of groups the user participates in
   * 
   * @example
   * ```typescript
   * const count = await countParticipantsByUser(456);
   * ```
   */
  static async countParticipantsByUser(participant_id: number): Promise<number> {
    return await GroupParticipants.count({ where: { participant_id } });
  }

  /**
   * Check if group participant exists.
   * 
   * @async
   * @function groupParticipantExists
   * @param {number} group_id - The group's ID
   * @param {number} participant_id - The participant's ID
   * @returns {Promise<boolean>} True if participant exists in group
   * 
   * @example
   * ```typescript
   * const exists = await groupParticipantExists(123, 456);
   * ```
   */
  static async groupParticipantExists(group_id: number, participant_id: number): Promise<boolean> {
    const count = await GroupParticipants.count({ where: { group_id, participant_id } });
    return count > 0;
  }
}

/**
 * Factory function to initialize the GroupParticipants model with Sequelize.
 * Creates the junction table for group-participant relationships.
 * 
 * @function GroupParticipantsFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof GroupParticipants} The initialized GroupParticipants model
 * 
 * @example
 * ```typescript
 * const GroupParticipants = GroupParticipantsFactory(sequelize, DataTypes);
 * await GroupParticipants.create({
 *   group_id: 1,
 *   participant_id: 123
 * });
 * ```
 */
export function GroupParticipantsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  GroupParticipants.init({
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    participant_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: "ParticipantGroups_participants",
    timestamps: false,
    freezeTableName: true,
  });

  return GroupParticipants;
};
