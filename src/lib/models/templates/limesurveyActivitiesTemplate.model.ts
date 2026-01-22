import { Sequelize, Model } from "sequelize";

export class LimesurveyActivitiesTemplate extends Model {
  declare activity_template_id: number;
  declare survey_id: number;
  declare survey_owner: number | null;
}

export function LimesurveyActivitiesTemplateFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  LimesurveyActivitiesTemplate.init({
    activity_template_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    survey_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    survey_owner: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: "LimesurveyActivitiesTemplate",
    tableName: "Limesurvey_Activities_Template",
    timestamps: false,
  });

  return LimesurveyActivitiesTemplate;
}