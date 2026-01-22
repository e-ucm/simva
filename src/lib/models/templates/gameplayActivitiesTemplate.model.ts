import { Sequelize, Model } from "sequelize";

export class GameplayActivitiesTemplate extends Model {
  declare activity_template_id: number;
  declare category_id: number | null;
  declare subject_area_id: number | null;
  declare game_type: "WEB" | "DESKTOP";
  declare game_url: string;
}

export function GameplayActivitiesTemplateFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  GameplayActivitiesTemplate.init({
    activity_template_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
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
      validate: {
        isIn: [["WEB", "DESKTOP"]],
      },
    },
    game_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "GameplayActivitiesTemplate",
    tableName: "GamePlay_Activities_Template",
    timestamps: false,
  });

  return GameplayActivitiesTemplate;
}