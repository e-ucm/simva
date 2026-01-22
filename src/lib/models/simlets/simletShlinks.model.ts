import { Sequelize, Model } from "sequelize";

export class SimletShlinks extends Model {
  declare simlet_id: number;
  declare short_url: string;
  declare short_code: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare valid_date: Date | null;
  declare expiration_date: Date | null;
  declare title: string;
  declare domain: string;
}

export function SimletShlinksFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SimletShlinks.init({
    simlet_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    short_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    short_code: {
      type: DataTypes.STRING,
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
    valid_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiration_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "SimletShlinks",
    tableName: "SIMLETs_shlinks",
    timestamps: true,
  });

  return SimletShlinks;
}