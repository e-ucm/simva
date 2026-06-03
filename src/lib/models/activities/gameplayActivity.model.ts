import { Sequelize, Model } from "sequelize";

export class GameplayActivity extends Model {
  declare activity_id: number;
  declare game_backup: boolean;
  declare game_scorm_xapi: boolean;
  declare game_type: "WEB" | "DESKTOP";
  declare game_url: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function GameplayActivityFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  GameplayActivity.init({
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    game_backup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    game_scorm_xapi: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    game_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [["WEB", "DESKTOP"]] },
    },
    game_url: {
      type: DataTypes.STRING,
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
    modelName: "GameplayActivity",
    tableName: "GamePlay_Activities",
    timestamps: true,
    freezeTableName: true,
  });

  return GameplayActivity;
}