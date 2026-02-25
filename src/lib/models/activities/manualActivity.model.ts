import { Sequelize, Model } from "sequelize";

export class ManualActivity extends Model {
  declare activity_id: number;
  declare manual_user_managed: boolean;
  declare manual_ressource_type: "WEB" | "EXTERNAL";
  declare manual_ressource_url: string;
}

export function ManualActivityFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ManualActivity.init({
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    manual_user_managed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    manual_ressource_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [["WEB", "EXTERNAL"]] },
    },
    manual_ressource_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "ManualActivity",
    tableName: "Manual_Activities",
    timestamps: false,
    freezeTableName: true,
  });

  return ManualActivity;
}