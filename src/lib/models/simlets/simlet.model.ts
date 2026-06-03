/**
 * @fileoverview Simlet model for SIMVA API.
 * Represents a SIMLET (Simulation Learning Environment Template) - the main learning container.
 * 
 * @module models/simlets/simlet
 */
import { NotFoundError } from "@/lib/errors/appErrors";
import { Sequelize, Model, Op } from "sequelize";

/**
 * Simlet model representing a SIMLET in SIMVA.
 * SIMLETs are the top-level learning environments that contain sessions and activities.
 * 
 * @class Simlet
 * @extends Model
 * 
 * @property {number} simlet_id - Primary key identifier for the SIMLET
 * @property {string|null} mongo_id - Optional MongoDB identifier for external data storage
 * @property {string} simlet_name - Display name of the SIMLET
 * @property {Date} createdAt - Timestamp when the SIMLET was created
 * @property {Date} updatedAt - Timestamp when the SIMLET was last updated
 * @property {number|null} simlet_sandbox_session_id - Optional reference to sandbox session for testing
 * @property {string} simlet_description - Detailed description of the SIMLET
 * @property {string|null} simlet_objective - Learning objective of the SIMLET
 * @property {number} allocator_id - Foreign key to the allocator for user assignment
 * @property {number} simlet_coordinator_id - Foreign key to the coordinator (teacher) of this SIMLET
 */
export class Simlet extends Model {
  
  declare simlet_id: number;
  declare mongo_id: string | null;
  declare simlet_name: string;
  declare simlet_archived: boolean;
  declare simlet_description: string;
  declare simlet_supervisor_id: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

/**
 * Factory function to initialize the Simlet model with Sequelize.
 * Defines the database schema and relationships for SIMLETs.
 * 
 * @function SimletFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof Simlet} The initialized Simlet model
 * 
 * @example
 * ```typescript
 * const Simlet = SimletFactory(sequelize, DataTypes);
 * const simlet = await Simlet.create({
 *   name: 'Mathematics Simulation',
 *   description: 'Interactive math learning environment',
 *   allocator_id: 1,
 *   simlet_coordinator_id: 1
 * });
 * ```
 */
export function SimletFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Simlet.init({
    simlet_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true,
    },
    mongo_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    simlet_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    simlet_archived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    simlet_description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    simlet_supervisor_id: {
      type: DataTypes.INTEGER,
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
  }, {
    sequelize,
    modelName: "Simlet",
    tableName: "SIMLETs",
    timestamps: true,
  });

  return Simlet;
}