/**
 * @fileoverview Gameplay Activities Template model definition.
 * Represents configuration for gameplay activities within activity templates.
 * 
 * Gameplay activities are interactive games and simulations that can be web-based
 * or desktop applications, categorized by subject area and educational content type.
 * 
 * @module models/templates/gameplayActivitiesTemplate
 * @requires sequelize
 */

import { Sequelize, Model } from "sequelize";

/**
 * Gameplay Activities Template model class.
 * Extends Sequelize Model to represent gameplay activity template configurations.
 * 
 * @class GameplayActivitiesTemplate
 * @extends Model
 * @property {number} activity_template_id - Primary key referencing ActivityTemplate
 * @property {number | null} category_id - Optional category classification for the game
 * @property {number | null} subject_area_id - Optional subject area classification
 * @property {"WEB" | "DESKTOP"} game_type - Platform type for the game
 * @property {string} game_url - URL or path to the game resource
 */
export class GameplayActivitiesTemplate extends Model {
  declare activity_template_id: number;
  declare category_id: number | null;
  declare subject_area_id: number | null;
  declare game_type: "WEB" | "DESKTOP";
  declare game_url: string;
}

/**
 * Factory function to initialize the GameplayActivitiesTemplate model with Sequelize.
 * Defines the database schema and constraints for gameplay activity templates.
 * 
 * @function GameplayActivitiesTemplateFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof GameplayActivitiesTemplate} The initialized GameplayActivitiesTemplate model
 * 
 * @example
 * ```typescript
 * const GameplayActivitiesTemplate = GameplayActivitiesTemplateFactory(sequelize, DataTypes);
 * 
 * // Create a new gameplay template activity
 * const gameTemplate = await GameplayActivitiesTemplate.create({
 *   activity_template_id: 123,
 *   category_id: 1,
 *   subject_area_id: 2,
 *   game_type: "WEB",
 *   game_url: "https://example.com/game"
 * });
 * ```
 */
export function GameplayActivitiesTemplateFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  GameplayActivitiesTemplate.init({
    activity_template_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subject_area_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    game_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["WEB", "DESKTOP"]],
      },
    },
    game_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "GameplayActivitiesTemplate",
    tableName: "GamePlay_Activities_Template",
    timestamps: false,
  });

  return GameplayActivitiesTemplate;
}