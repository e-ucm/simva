import { Sequelize, Model } from "sequelize";

export class Allocator extends Model {
  declare allocator_id: number;
  declare mongo_id: string | null;
  declare allocator_type: "default" | "group" | "random";
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function AllocatorFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Allocator.init({
    allocator_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mongo_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    allocator_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["default", "group", "random"]],
      },
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
    modelName: "Allocator",
    tableName: "Allocators",
    timestamps: true,
  });

  return Allocator;
}