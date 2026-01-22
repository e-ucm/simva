/**
 * @fileoverview CategoryList model for SIMVA API.
 * Represents predefined categories for organizing and classifying content.
 * 
 * @module models/tags/categoryList
 */

import { Sequelize, Model } from "sequelize";

/**
 * CategoryList model representing predefined content categories.
 * Provides a controlled vocabulary for content classification and organization.
 * 
 * @class CategoryList
 * @extends Model
 * 
 * @property {number} category_id - Primary key identifier for the category
 * @property {string} category_name - Display name of the category
 */
export class CategoryList extends Model {
  declare category_id: number;
  declare category_name: string;
}

/**
 * Factory function to initialize the CategoryList model with Sequelize.
 * Creates the categories lookup table for content classification.
 * 
 * @function CategoryListFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof CategoryList} The initialized CategoryList model
 * 
 * @example
 * ```typescript
 * const CategoryList = CategoryListFactory(sequelize, DataTypes);
 * await CategoryList.create({
 *   category_name: 'Educational Games'
 * });
 * ```
 */

export function CategoryListFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  CategoryList.init({
    category_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "CategoryList",
    tableName: "Category_list",
    timestamps: false,
  });

  return CategoryList;
}