import { Sequelize, Model } from "sequelize";

export class CategoryList extends Model {
  declare category_id: number;
  declare category_name: string;
}

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