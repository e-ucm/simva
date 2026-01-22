import { Sequelize, Model } from "sequelize";

/**
 * User model representing the main user entity in SIMVA.
 * Stores user authentication and profile information.
 * 
 * @class User
 * @extends Model
 * 
 * @property {number} user_id - Primary key identifier for the user
 * @property {string} username - Unique username for the user
 * @property {string} email - Email address of the user
 * @property {boolean} isToken - Whether the user is authenticated via token
 * @property {string|null} token - Authentication token (if applicable)
 * @property {string} role - User role (admin, teacher, student, etc.)
 * @property {Date} createdAt - Timestamp when the user was created
 * @property {Date} updatedAt - Timestamp when the user was last updated
 */
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

/**
 * Factory function to initialize the User model with Sequelize.
 * Defines the database schema and constraints for the User table.
 * 
 * @function UserFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof User} The initialized User model
 * 
 * @example
 * ```typescript
 * const User = UserFactory(sequelize, DataTypes);
 * const user = await User.create({ username: 'john', email: 'john@example.com', role: 'student' });
 * ```
 */
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