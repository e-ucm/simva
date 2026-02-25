import { Sequelize, Model } from "sequelize";

export class GameplayActivity extends Model {
  declare activity_id: number;
  declare game_backup: boolean;
  declare game_scorm_xapi: boolean;
  declare game_type: "WEB" | "DESKTOP";
  declare game_url: string;
  declare category_id: number | null;
  declare subject_area_id: number | null;
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
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subject_area_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: "GameplayActivity",
    tableName: "GamePlay_Activities",
    timestamps: false,
    freezeTableName: true,
  });

  return GameplayActivity;
}