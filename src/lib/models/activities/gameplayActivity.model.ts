import { Sequelize, Model } from "sequelize";

export class GameplayActivity extends Model {
  declare activity_id: number;
  declare backup: boolean;
  declare scorm_xapi_by_game: boolean;
  declare category_id: number | null;
  declare subject_area_id: number | null;
  declare game_type: string;
  declare game_url: string;
}

export function GameplayActivityFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  GameplayActivity.init({
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    backup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    scorm_xapi_by_game: {
      type: DataTypes.BOOLEAN,
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
    game_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    game_url: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "GamePlay_Activities",
    timestamps: false,
    freezeTableName: true,
  });

  return GameplayActivity;
};