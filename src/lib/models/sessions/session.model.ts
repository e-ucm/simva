/**
 * @fileoverview Session model for SIMVA API.
 * Represents a learning session within a SIMLET with specific timing and supervision.
 * 
 * @module models/sessions/session
 */

import { Sequelize, Model, Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Session model representing a learning session in SIMVA.
 * Sessions are containers for activities with specific time bounds and supervision.
 * 
 * @class Session
 * @extends Model
 * 
 * @property {number} simlet_id - Foreign key to the parent SIMLET
 * @property {number} session_id - Primary key identifier for the session
 * @property {string|null} mongo_id - Optional MongoDB identifier for external data storage
 * @property {string} name - Display name of the session
 * @property {string} description - Detailed description of the session
 * @property {Date} createdAt - Timestamp when the session was created
 * @property {Date} updatedAt - Timestamp when the session was last updated
 * @property {string|null} experimental_method - Research methodology for the session
 * @property {boolean|null} active - Whether the session is currently active
 * @property {Date|null} session_start_date - When the session should start
 * @property {Date|null} session_end_date - When the session should end
 * @property {number} session_supervisor_id - Foreign key to the session supervisor (teacher)
 */
export class Session extends Model {
  declare simlet_id: number;
  declare session_id: number;
  declare mongo_id: string | null;
  declare name: string;
  declare description: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare experimental_method: string | null;
  declare active: boolean | null;
  declare session_start_date: Date | null;
  declare session_end_date: Date | null;
  declare session_supervisor_id: number;

  /**
   * Retrieve all sessions from the database.
   * 
   * @async
   * @function getAllSessions
   * @param {number} [limit] - Maximum number of sessions to return
   * @param {number} [offset] - Number of sessions to skip for pagination
   * @returns {Promise<Session[]>} Array of sessions
   * 
   * @example
   * ```typescript
   * const sessions = await Session.getAllSessions();
   * const paginatedSessions = await Session.getAllSessions(10, 20);
   * ```
   */
  static async getAllSessions(
    limit?: number,
    offset?: number
  ): Promise<Session[]> {
    return await Session.findAll({
      order: [['session_id', 'ASC']],
      limit,
      offset
    });
  }

  /**
   * Retrieve a session by its ID.
   * 
   * @async
   * @function getSessionById
   * @param {number} session_id - The session's ID
   * @returns {Promise<Session>} The session object
   * @throws {NotFoundError} If session with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const session = await Session.getSessionById(123);
   * ```
   */
  static async getSessionById(session_id: number): Promise<Session> {
    const session = await Session.findByPk(session_id);
    
    if (!session) {
      throw new NotFoundError(`Session with ID ${session_id} not found`);
    }
    
    return session;
  }

  /**
   * Retrieve sessions by simlet ID.
   * 
   * @async
   * @function getSessionsBySimletId
   * @param {number} simlet_id - The simlet's ID
   * @returns {Promise<Session[]>} Array of sessions in the simlet
   * 
   * @example
   * ```typescript
   * const sessions = await Session.getSessionsBySimletId(123);
   * ```
   */
  static async getSessionsBySimletId(simlet_id: number): Promise<Session[]> {
    return await Session.findAll({
      where: { simlet_id },
      order: [['session_start_date', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Retrieve sessions by supervisor ID.
   * 
   * @async
   * @function getSessionsBySupervisor
   * @param {number} session_supervisor_id - The supervisor's user ID
   * @returns {Promise<Session[]>} Array of sessions supervised by the user
   * 
   * @example
   * ```typescript
   * const sessions = await Session.getSessionsBySupervisor(123);
   * ```
   */
  static async getSessionsBySupervisor(
    session_supervisor_id: number
  ): Promise<Session[]> {
    return await Session.findAll({
      where: { session_supervisor_id },
      order: [['session_start_date', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Search sessions by name.
   * 
   * @async
   * @function searchSessionsByName
   * @param {string} name - The name pattern to search for
   * @returns {Promise<Session[]>} Array of sessions matching the name pattern
   * 
   * @example
   * ```typescript
   * const sessions = await Session.searchSessionsByName('test');
   * ```
   */
  static async searchSessionsByName(name: string): Promise<Session[]> {
    return await Session.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`
        }
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get active sessions.
   * 
   * @async
   * @function getActiveSessions
   * @returns {Promise<Session[]>} Array of active sessions
   * 
   * @example
   * ```typescript
   * const activeSessions = await Session.getActiveSessions();
   * ```
   */
  static async getActiveSessions(): Promise<Session[]> {
    return await Session.findAll({
      where: { active: true },
      order: [['session_start_date', 'ASC']]
    });
  }

  /**
   * Get sessions within a date range.
   * 
   * @async
   * @function getSessionsInDateRange
   * @param {Date} startDate - Start of the date range
   * @param {Date} endDate - End of the date range
   * @returns {Promise<Session[]>} Array of sessions in the date range
   * 
   * @example
   * ```typescript
   * const sessions = await Session.getSessionsInDateRange(new Date('2023-01-01'), new Date('2023-12-31'));
   * ```
   */
  static async getSessionsInDateRange(startDate: Date, endDate: Date): Promise<Session[]> {
    return await Session.findAll({
      where: {
        [Op.or]: [
          {
            session_start_date: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            session_end_date: {
              [Op.between]: [startDate, endDate]
            }
          }
        ]
      },
      order: [['session_start_date', 'ASC']]
    });
  }

  /**
   * Create a new session.
   * 
   * @async
   * @function createSession
   * @param {Partial<Session>} sessionData - The session data for creation
   * @returns {Promise<Session>} The created session
   * 
   * @example
   * ```typescript
   * const newSession = await Session.createSession({
   *   simlet_id: 1,
   *   name: 'Test Session',
   *   description: 'A test learning session',
   *   session_supervisor_id: 123
   * });
   * ```
   */
  static async createSession(sessionData: Partial<Session>): Promise<Session> {
    return await Session.create(sessionData);
  }

  /**
   * Update an existing session by ID.
   * 
   * @async
   * @function updateSession
   * @param {number} session_id - The session's ID
   * @param {Partial<Session>} updateData - The data to update
   * @returns {Promise<Session>} The updated session
   * @throws {NotFoundError} If session with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const updatedSession = await Session.updateSession(123, {
   *   name: 'Updated Session Name',
   *   active: true
   * });
   * ```
   */
  static async updateSession(
    session_id: number,
    updateData: Partial<Session>
  ): Promise<Session> {
    const session = await this.getSessionById(session_id);
    
    await session.update(updateData);
    await session.reload();
    
    return session;
  }

  /**
   * Delete a session by ID.
   * 
   * @async
   * @function deleteSession
   * @param {number} session_id - The session's ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If session with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * await Session.deleteSession(123);
   * ```
   */
  static async deleteSession(session_id: number): Promise<void> {
    const session = await this.getSessionById(session_id);
    await session.destroy();
  }

  /**
   * Count total number of sessions.
   * 
   * @async
   * @function countSessions
   * @returns {Promise<number>} Total count of sessions
   * 
   * @example
   * ```typescript
   * const count = await Session.countSessions();
   * ```
   */
  static async countSessions(): Promise<number> {
    return await Session.count();
  }

  /**
   * Count sessions by simlet.
   * 
   * @async
   * @function countSessionsBySimlet
   * @param {number} simlet_id - The simlet's ID
   * @returns {Promise<number>} Count of sessions in the simlet
   * 
   * @example
   * ```typescript
   * const count = await Session.countSessionsBySimlet(123);
   * ```
   */
  static async countSessionsBySimlet(simlet_id: number): Promise<number> {
    return await Session.count({ where: { simlet_id } });
  }

  /**
   * Count sessions by supervisor.
   * 
   * @async
   * @function countSessionsBySupervisor
   * @param {number} session_supervisor_id - The supervisor's user ID
   * @returns {Promise<number>} Count of sessions supervised by the user
   * 
   * @example
   * ```typescript
   * const count = await Session.countSessionsBySupervisor(123);
   * ```
   */
  static async countSessionsBySupervisor(session_supervisor_id: number): Promise<number> {
    return await Session.count({ where: { session_supervisor_id } });
  }

  /**
   * Check if a session exists by ID.
   * 
   * @async
   * @function sessionExists
   * @param {number} session_id - The session's ID
   * @returns {Promise<boolean>} True if session exists, false otherwise
   * 
   * @example
   * ```typescript
   * const exists = await Session.sessionExists(123);
   * ```
   */
  static async sessionExists(session_id: number): Promise<boolean> {
    const count = await Session.count({ where: { session_id } });
    return count > 0;
  }
}

/**
 * Factory function to initialize the Session model with Sequelize.
 * Defines the database schema and relationships for sessions.
 * 
 * @function SessionFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof Session} The initialized Session model
 * 
 * @example
 * ```typescript
 * const Session = SessionFactory(sequelize, DataTypes);
 * const session = await Session.create({
 *   simlet_id: 1,
 *   name: 'Week 1 Activities',
 *   description: 'Introduction to concepts',
 *   session_supervisor_id: 1
 * });
 * ```
 */
export function SessionFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Session.init({
    simlet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    session_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mongo_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    experimental_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    session_start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    session_end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    session_supervisor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "Session",
    tableName: "Sessions",
    timestamps: true,
  });

  return Session;
}