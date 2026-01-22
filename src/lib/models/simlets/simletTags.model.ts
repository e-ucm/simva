import { Sequelize, Model } from "sequelize";

export class SimletTags extends Model {
  declare simlet_id: number;
  declare tag_id: number;
}

export function SimletTagsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SimletTags.init({
    simlet_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "SimletTags",
    tableName: "SIMLETs_tags",
    timestamps: false,
  });

  return SimletTags;
}