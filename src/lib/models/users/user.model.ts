import { Sequelize, Model } from "sequelize";

export class User extends Model {
  declare user_id: number;
  declare username: string;
  declare email: string;
  declare isToken: boolean;
  declare token: string | null;
  declare role: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function UserFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  User.init({
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isToken: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
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
    tableName: "Users",
    timestamps: true,
    freezeTableName: true,
  });

  return User;
};