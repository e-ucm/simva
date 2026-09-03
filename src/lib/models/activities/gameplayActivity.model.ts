import { Sequelize, Model } from "sequelize";

export class GameplayActivity extends Model {
  declare activity_id: number;
  declare game_backup: boolean;
  declare game_scorm_xapi: boolean;
  declare game_type: "WEB" | "DESKTOP";
  declare game_url: string;
  declare game_technology:string|null;
  declare game_tracker_technology:string|null;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
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
    game_technology: {
      type: DataTypes.STRING,
      allowNull: true,      
      validate: { isIn: [["Godot", "Unity", "Phaser", "Unreal Engine"]] },
    },
    game_tracker_technology: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isIn: [["Xasu", "Xasu+Simva_Plugin", "other"]] },
    },
    oauth_login_mode: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isIn: [["device_oauth2", "token_oauth2"]] },
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: "GameplayActivity",
    tableName: "GamePlay_Activities",
    timestamps: true,
    paranoid: true,
    freezeTableName: true,
  });

  return GameplayActivity;
}