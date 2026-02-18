import { Sequelize, Model } from "sequelize";

export class LimesurveyActivity extends Model {
  declare activity_id: number;
  declare survey_id: number;
  declare suvey_language: string;
  declare survey_lrsset: number | null;
}

export function LimesurveyActivityFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  LimesurveyActivity.init({
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    survey_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    suvey_language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    survey_lrsset: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  },
  {
    sequelize,
    tableName: "Limesurvey_Activities",
    timestamps: false,
    freezeTableName: true,
  });

  return LimesurveyActivity;
};