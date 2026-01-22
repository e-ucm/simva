import { Sequelize, Model } from "sequelize";

export class Group extends Model {
  declare group_id: number;
  declare name: string;
  declare use_new_generation: boolean;
  declare group_owner_id: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function GroupFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Group.init({
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    use_new_generation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    group_owner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt:{
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt:{
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "ParticipantGroups",
    timestamps: true,
    freezeTableName: true,
  });

  return Group;
};
