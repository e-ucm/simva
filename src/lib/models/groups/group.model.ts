/**
 * @fileoverview Group model for SIMVA API.
 * Represents participant groups for organizing users in learning activities.
 * 
 * @module models/groups/group
 */

import { Sequelize, Model, Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Group model representing participant groups in SIMVA.
 * Groups organize users for collaborative learning activities and experiments.
 * 
 * @class Group
 * @extends Model
 * 
 * @property {number} group_id - Primary key identifier for the group
 * @property {string} name - Display name of the group
 * @property {boolean} use_new_generation - Whether to use new generation features
 * @property {number|null} group_owner_id - Foreign key to the group owner (teacher/admin)
 * @property {Date} createdAt - Timestamp when the group was created
 * @property {Date} updatedAt - Timestamp when the group was last updated
 */
export class Group extends Model {
  declare group_id: number;
  declare name: string;
  declare use_new_generation: boolean;
  declare group_owner_id: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  /**
   * Retrieve all groups from the database.
   * 
   * @async
   * @function getAllGroups
   * @param {number} [limit] - Maximum number of groups to return
   * @param {number} [offset] - Number of groups to skip for pagination
   * @returns {Promise<Group[]>} Array of groups
   * 
   * @example
   * ```typescript
   * const groups = await getAllGroups();
   * const paginatedGroups = await getAllGroups(10, 20);
   * ```
   */
  static async getAllGroups(limit?: number, offset?: number): Promise<Group[]> {
    return await Group.findAll({
      order: [['group_id', 'ASC']],
      limit,
      offset
    });
  }

  /**
   * Retrieve a group by its ID.
   * 
   * @async
   * @function getGroupById
   * @param {number} group_id - The group's ID
   * @returns {Promise<Group>} The group object
   * @throws {NotFoundError} If group with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const group = await getGroupById(123);
   * ```
   */
  static async getGroupById(group_id: number): Promise<Group> {
    const group = await Group.findByPk(group_id);
    
    if (!group) {
      throw new NotFoundError(`Group with ID ${group_id} not found`);
    }
    
    return group;
  }

  /**
   * Retrieve groups by owner ID.
   * 
   * @async
   * @function getGroupsByOwner
   * @param {number} group_owner_id - The owner's user ID
   * @returns {Promise<Group[]>} Array of groups owned by the user
   * 
   * @example
   * ```typescript
   * const groups = await getGroupsByOwner(123);
   * ```
   */
  static async getGroupsByOwner(group_owner_id: number): Promise<Group[]> {
    return await Group.findAll({
      where: { group_owner_id },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Search groups by name.
   * 
   * @async
   * @function searchGroupsByName
   * @param {string} name - The name pattern to search for
   * @returns {Promise<Group[]>} Array of groups matching the name pattern
   * 
   * @example
   * ```typescript
   * const groups = await searchGroupsByName('test');
   * ```
   */
  static async searchGroupsByName(name: string): Promise<Group[]> {
    return await Group.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`
        }
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Retrieve groups by generation setting.
   * 
   * @async
   * @function getGroupsByGeneration
   * @param {boolean} use_new_generation - The generation setting
   * @returns {Promise<Group[]>} Array of groups with specified generation setting
   * 
   * @example
   * ```typescript
   * const newGenGroups = await getGroupsByType(true);
   * ```
   */
  static async getGroupsByGeneration(use_new_generation: boolean): Promise<Group[]> {
    return await Group.findAll({
      where: { use_new_generation },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get groups created after a specific date.
   * 
   * @async
   * @function getGroupsCreatedAfter
   * @param {Date} date - The date to compare against
   * @returns {Promise<Group[]>} Array of groups created after the date
   * 
   * @example
   * ```typescript
   * const recentGroups = await getGroupsCreatedAfter(new Date('2023-01-01'));
   * ```
   */
  static async getGroupsCreatedAfter(date: Date): Promise<Group[]> {
    return await Group.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gt]: date
        }
      },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Create a new group.
   * 
   * @async
   * @function createGroup
   * @param {Partial<Group>} groupData - The group data for creation
   * @returns {Promise<Group>} The created group
   * 
   * @example
   * ```typescript
   * const newGroup = await createGroup({
   *   name: 'Test Group',
   *   use_new_generation: true,
   *   group_owner_id: 123
   * });
   * ```
   */
  static async createGroup(groupData: Partial<Group>): Promise<Group> {
    return await Group.create(groupData);
  }

  /**
   * Update an existing group by ID.
   * 
   * @async
   * @function updateGroup
   * @param {number} group_id - The group's ID
   * @param {Partial<Group>} updateData - The data to update
   * @returns {Promise<Group>} The updated group
   * @throws {NotFoundError} If group with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const updatedGroup = await updateGroup(123, {
   *   name: 'Updated Group Name'
   * });
   * ```
   */
  static async updateGroup(group_id: number, updateData: Partial<Group>): Promise<Group> {
    const group = await Group.getGroupById(group_id);
    
    await group.update(updateData);
    await group.reload();
    
    return group;
  }

  /**
   * Delete a group by ID.
   * 
   * @async
   * @function deleteGroup
   * @param {number} group_id - The group's ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If group with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * await deleteGroup(123);
   * ```
   */
  static async deleteGroup(group_id: number): Promise<void> {
    const group = await Group.getGroupById(group_id);
    await group.destroy();
  }

  /**
   * Count total number of groups.
   * 
   * @async
   * @function countGroups
   * @returns {Promise<number>} Total count of groups
   * 
   * @example
   * ```typescript
   * const count = await Group.countGroups();
   * ```
   */
  static async countGroups(): Promise<number> {
    return await Group.count();
  }

  /**
   * Count groups by owner.
   * 
   * @async
   * @function countGroupsByOwner
   * @param {number} group_owner_id - The owner's user ID
   * @returns {Promise<number>} Count of groups owned by the user
   * 
   * @example
   * ```typescript
   * const count = await Group.countGroupsByOwner(123);
   * ```
   */
  static async countGroupsByOwner(group_owner_id: number): Promise<number> {
    return await Group.count({ where: { group_owner_id } });
  }

  /** * Get total count of all groups.
   * 
   * @async
   * @function getGroupCount
   * @returns {Promise<number>} Total number of groups
   * 
   * @example
   * ```typescript
   * const count = await getGroupCount();
   * ```
   */
  static async getGroupCount(): Promise<number> {
    return await Group.count();
  }

  /** * Check if a group exists by ID.
   * 
   * @async
   * @function groupExists
   * @param {number} group_id - The group's ID
   * @returns {Promise<boolean>} True if group exists, false otherwise
   * 
   * @example
   * ```typescript
   * const exists = await groupExists(123);
   * ```
   */
  static async groupExists(group_id: number): Promise<boolean> {
    const count = await Group.count({ where: { group_id } });
    return count > 0;
  }

  /**
   * Check if a group name is available (not taken).
   * 
   * @async
   * @function isGroupNameAvailable
   * @param {string} name - The group name to check
   * @returns {Promise<boolean>} True if name is available, false if taken
   * 
   * @example
   * ```typescript
   * const available = await isGroupNameAvailable('New Group');
   * ```
   */
  static async isGroupNameAvailable(name: string): Promise<boolean> {
    const count = await Group.count({ where: { name } });
    return count === 0;
  }

  /**
   * Count groups by generation setting.
   * 
   * @async
   * @function countGroupsByType
   * @param {boolean} use_new_generation - The generation setting
   * @returns {Promise<number>} Count of groups with specified generation setting
   * 
   * @example
   * ```typescript
   * const count = await countGroupsByType(true);
   * ```
   */
  static async countGroupsByType(use_new_generation: boolean): Promise<number> {
    return await Group.count({ where: { use_new_generation } });
  }

  /**
   * Get all distinct generation settings.
   * 
   * @async
   * @function getDistinctGenerations
   * @returns {Promise<boolean[]>} Array of distinct generation settings
   * 
   * @example
   * ```typescript
   * const settings = await Group.getDistinctGenerations();
   * ```
   */
  static async getDistinctGenerations(): Promise<boolean[]> {
    const records = await Group.findAll({
      attributes: ['use_new_generation'],
      group: ['use_new_generation'],
      order: [['use_new_generation', 'ASC']]
    });
    
    return records.map(record => record.use_new_generation);
  }
}

/**
 * Factory function to initialize the Group model with Sequelize.
 * Defines the database schema and relationships for participant groups.
 * 
 * @function GroupFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof Group} The initialized Group model
 * 
 * @example
 * ```typescript
 * const Group = GroupFactory(sequelize, DataTypes);
 * const group = await Group.create({
 *   name: 'Study Group A',
 *   use_new_generation: true,
 *   group_owner_id: 1
 * });
 * ```
 */
export function GroupFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Group.init({
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    use_new_generation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    group_owner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt:{
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt:{
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "ParticipantGroups",
    timestamps: true,
    freezeTableName: true,
  });

  return Group;
};
