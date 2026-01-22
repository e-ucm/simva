/**
 * @fileoverview LimesurveyActivitiesTemplate model for SIMVA API.
 * Represents the relationship between activity templates and LimeSurvey surveys.
 * 
 * @module models/templates/limesurveyActivitiesTemplate
 */

import { Sequelize, Model } from "sequelize";

/**
 * LimesurveyActivitiesTemplate model representing survey-based activity templates.
 * Links activity templates with external LimeSurvey surveys for data collection.
 * 
 * @class LimesurveyActivitiesTemplate
 * @extends Model
 * 
 * @property {number} activity_template_id - Primary key and foreign key to the activity template
 * @property {number} survey_id - LimeSurvey survey identifier
 * @property {number|null} survey_owner - User ID of the survey owner (optional)
 */
export class LimesurveyActivitiesTemplate extends Model {
  declare activity_template_id: number;
  declare survey_id: number;
  declare survey_owner: number | null;
}

/**
 * Factory function to initialize the LimesurveyActivitiesTemplate model with Sequelize.
 * Creates the mapping table between activity templates and LimeSurvey surveys.
 * 
 * @function LimesurveyActivitiesTemplateFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof LimesurveyActivitiesTemplate} The initialized LimesurveyActivitiesTemplate model
 * 
 * @example
 * ```typescript
 * const LimesurveyActivitiesTemplate = LimesurveyActivitiesTemplateFactory(sequelize, DataTypes);
 * await LimesurveyActivitiesTemplate.create({
 *   activity_template_id: 1,
 *   survey_id: 456,
 *   survey_owner: 789
 * });
 * ```
 */

export function LimesurveyActivitiesTemplateFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  LimesurveyActivitiesTemplate.init({
    activity_template_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    survey_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    survey_owner: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: "LimesurveyActivitiesTemplate",
    tableName: "Limesurvey_Activities_Template",
    timestamps: false,
  });

  return LimesurveyActivitiesTemplate;
}