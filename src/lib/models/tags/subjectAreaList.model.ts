/**
 * @fileoverview SubjectAreaList model for SIMVA API.
 * Represents academic subject areas for educational content classification.
 * 
 * @module models/tags/subjectAreaList
 */

import { Sequelize, Model } from "sequelize";

/**
 * SubjectAreaList model representing academic subject areas.
 * Provides standardized subject area classification for educational content.
 * 
 * @class SubjectAreaList
 * @extends Model
 * 
 * @property {number} subject_area_id - Primary key identifier for the subject area
 * @property {string} subject_area_name - Display name of the subject area (e.g., 'Mathematics', 'Science')
 */
export class SubjectAreaList extends Model {
  declare subject_area_id: number;
  declare subject_area_name: string;
}

/**
 * Factory function to initialize the SubjectAreaList model with Sequelize.
 * Creates the subject areas lookup table for academic classification.
 * 
 * @function SubjectAreaListFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof SubjectAreaList} The initialized SubjectAreaList model
 * 
 * @example
 * ```typescript
 * const SubjectAreaList = SubjectAreaListFactory(sequelize, DataTypes);
 * await SubjectAreaList.create({
 *   subject_area_name: 'Computer Science'
 * });
 * ```
 */

export function SubjectAreaListFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SubjectAreaList.init({
    subject_area_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    subject_area_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "SubjectAreaList",
    tableName: "Subject_area_list",
    timestamps: false,
  });

  return SubjectAreaList;
}