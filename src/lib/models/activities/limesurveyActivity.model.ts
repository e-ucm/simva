import { Sequelize, Model } from "sequelize";

export class LimesurveyActivity extends Model {
  declare activity_id: number;
  declare survey_id: number;
  declare language: string;
  declare lrsset: number;
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
    language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lrsset: {
      type: DataTypes.INTEGER,
      allowNull: false,
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