import { Sequelize, Model } from "sequelize";

export class SimletShlinks extends Model {
  declare simlet_id: number;
  declare short_url: string;
  declare short_code: string;
  declare short_valid_date: Date | null;
  declare short_expiration_date: Date | null;
  declare short_title: string;
  declare short_domain: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
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
    short_valid_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    short_expiration_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    short_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    short_domain: {
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: "SimletShlinks",
    tableName: "SIMLETs_shlinks",
    timestamps: true,
    paranoid: true,
  });

  return SimletShlinks;
}