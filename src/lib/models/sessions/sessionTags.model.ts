import { Sequelize, Model } from "sequelize";

export class SessionTags extends Model {
  declare session_id: number;
  declare tag_id: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function SessionTagsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SessionTags.init({
    session_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
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
    modelName: "SessionTags",
    tableName: "Sessions_tags",
    timestamps: true,
  });

  return SessionTags;
}