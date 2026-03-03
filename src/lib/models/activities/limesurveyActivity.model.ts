import { Sequelize, Model } from "sequelize";

export class LimesurveyActivity extends Model {
  declare activity_id: number;
  declare survey_id: number;
  declare survey_language: string;
  declare survey_lrsset: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function LimesurveyActivityFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  LimesurveyActivity.init({
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    survey_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    survey_language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    survey_lrsset: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    modelName: "LimesurveyActivity",
    tableName: "Limesurvey_Activities",
    timestamps: true,
    freezeTableName: true,
  });

  return LimesurveyActivity;
}