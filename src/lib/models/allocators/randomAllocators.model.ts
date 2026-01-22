import { Sequelize, Model } from "sequelize";

export class RandomAllocators extends Model {
  declare allocator_id: number;
  declare session_id: number;
  declare percentage: number;
}

export function RandomAllocatorsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  RandomAllocators.init({
    allocator_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    session_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    percentage: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "RandomAllocators",
    tableName: "Random_Allocators",
    timestamps: false,
  });

  return RandomAllocators;
}