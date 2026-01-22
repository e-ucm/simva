import { Sequelize, Model } from "sequelize";

export class SessionTagsList extends Model {
  declare session_tag_id: number;
  declare session_tag_name: string;
}

export function SessionTagsListFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SessionTagsList.init({
    session_tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    session_tag_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "SessionTagsList",
    tableName: "Sessions_tags_list",
    timestamps: false,
  });

  return SessionTagsList;
}