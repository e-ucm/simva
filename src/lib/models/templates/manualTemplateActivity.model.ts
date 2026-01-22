import { Sequelize, Model } from "sequelize";

export class ManualTemplateActivity extends Model {
  declare activity_template_id: number;
  declare ressource_type: "EXTERNAL" | "WEB";
  declare ressource_url: string;
}

export function ManualTemplateActivityFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ManualTemplateActivity.init({
    activity_template_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    ressource_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["EXTERNAL", "WEB"]],
      },
    },
    ressource_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "ManualTemplateActivity",
    tableName: "Manual_Template_Activities",
    timestamps: false,
  });

  return ManualTemplateActivity;
}