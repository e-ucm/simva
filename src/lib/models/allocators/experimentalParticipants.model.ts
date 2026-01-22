import { Sequelize, Model } from "sequelize";

export class ExperimentalParticipants extends Model {
  declare allocator_id: number;
  declare group_id: number;
  declare participant_id: number;
  declare session_id: number;
}

export function ExperimentalParticipantsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ExperimentalParticipants.init({
    allocator_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    participant_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    session_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "ExperimentalParticipants",
    tableName: "Experimental_Participants",
    timestamps: false,
  });

  return ExperimentalParticipants;
}