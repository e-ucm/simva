import { Sequelize, Model } from "sequelize";

export class ActivityTemplate extends Model {
  declare activity_template_id: number;
  declare name: string;
  declare activity_type: "default" | "manual" | "limesurvey" | "gameplay" | "lti_tool";
  declare description: string;
  declare public: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare owner_id: number;
}

export function ActivityTemplateFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ActivityTemplate.init({
    activity_template_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activity_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["default", "manual", "limesurvey", "gameplay", "lti_tool"]],
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    public: {
      type: DataTypes.BOOLEAN,
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
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "ActivityTemplate",
    tableName: "Activities_template",
    timestamps: true,
  });

  return ActivityTemplate;
}