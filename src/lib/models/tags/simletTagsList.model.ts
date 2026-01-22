import { Sequelize, Model } from "sequelize";

export class SimletTagsList extends Model {
  declare simlet_tag_id: number;
  declare simlet_tag_name: string;
}

export function SimletTagsListFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SimletTagsList.init({
    simlet_tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    simlet_tag_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "SimletTagsList",
    tableName: "SIMLETs_tags_list",
    timestamps: false,
  });

  return SimletTagsList;
}