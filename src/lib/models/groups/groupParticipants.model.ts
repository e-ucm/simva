import { Sequelize, Model } from "sequelize";

export class GroupParticipants extends Model {
  declare group_id: number;
  declare participant_id: number;
}

export function GroupParticipantsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  GroupParticipants.init({
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    participant_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: "ParticipantGroups_participants",
    timestamps: false,
    freezeTableName: true,
  });

  return GroupParticipants;
};
