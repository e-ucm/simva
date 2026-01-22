import { Sequelize, Model } from "sequelize";

export class ManualActivity extends Model {
  declare activity_id: number;
  declare user_managed: boolean;
  declare ressource_type: string;
  declare ressource_url: string;
}

export function ManualActivityFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ManualActivity.init({
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    user_managed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    ressource_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ressource_url: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "Manual_Activities",
    timestamps: false,
    freezeTableName: true,
  });

  return ManualActivity;
};