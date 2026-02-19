import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/appErrors";
import { Op } from "sequelize";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { KeycloakClient } from "@/lib/mappers/Users/keycloakclient";

export class User {
  declare user_id: number;
  declare username: string;
  declare email: string;
  declare isToken: boolean;
  declare token: string | null;
  declare role: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  constructor(data: any) {
    this.user_id = data.user_id;
    this.username = data.username;
    this.email = data.email;
    this.isToken = data.isToken;
    this.token = data.token;
    this.role = data.role;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async getFromPartialDBData(sql: Partial<User>): Promise<User[]> {
    let users = await db.Tables.User.findAll({ where: sql });
    return users.map((user: any) => new User(user));
  }

  static async getAllFromDbData(limit: number | undefined, offset: number | undefined, searchString: string | undefined): Promise<User[]> {
    let users = await db.Tables.User.findAll({
      order: [['user_id', 'ASC']],
      where: searchString ? {
        username: {
          [Op.like]: `%${searchString}%`
        }
      } : undefined,
      limit : limit !== undefined ? limit : undefined,
      offset : offset !== undefined ? offset : undefined
    });
    return users.map((user: any) => new User(user));
  }

  static async getFromDbData(user_id?: number, username?: string): Promise<User> {
    let model: InstanceType<typeof db.Tables.User> | null;
    if (!user_id && !username) {
        throw new NotFoundError("User ID or username must be provided");
    } else if (user_id && username) {
        throw new NotFoundError("Provide either user ID or username, not both");
    } else if (user_id) {
        model = await db.Tables.User.findOne({ where: { user_id: user_id } });
        if (!model) {
          throw new NotFoundError(`User with ID ${user_id} not found`);
        };
    } else {
        model = await db.Tables.User.findOne({ where: { username: username } });
        if (!model) {
          throw new NotFoundError(`User with username ${username} not found`);
        }
    }
    return new User({
      user_id: model.user_id,
      username: model.username,
      email: model.email,
      isToken: model.isToken,
      token: model.token,
      role: model.role,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static async createDB(userData: { username: any; email: string | undefined; role: string; isToken: boolean; }): Promise<User> {
    let user = await db.Tables.User.create(userData);
    return new User(user);
  }

  async update(partial: Partial<User>): Promise<User> {
    let user = await db.Tables.User.findOne({ where: { user_id: this.user_id } });
    if (!user) {
      throw new NotFoundError(`User with ID ${this.user_id} not found`);
    }
    await this.giveRoleToUserInKeycloak(partial.role as string);
    await user.update({ role : partial.role });
    this.role = partial.role as string;
    return this;
  }

  async giveRoleToUserInKeycloak(role?: string) : Promise<Boolean> {
      if(!config.sso.enabled){
          return true;
      }

      logger.info('KeyCloak -> Auth');

      const keycloakClient = new KeycloakClient();
      await keycloakClient.initialize();
      await keycloakClient.AuthClient();

      var userid = await keycloakClient.findUserIdByUsername(this.username);

      logger.info('KeyCloak -> getting Role Mappings');
      let roleMappings = await keycloakClient.getClient().users.listAvailableRealmRoleMappings({id: userid});

      let selectedRole;
      for (var i = roleMappings.length - 1; i >= 0; i--) {
          if(roleMappings[i].name === role){
              selectedRole = roleMappings[i];
              break;
          }
      }

      if (!selectedRole || !selectedRole.name || !selectedRole.id) {
          throw new Error(`Role ${role} not found in Keycloak`);
      }

      logger.info('KeyCloak -> Adding Role to User');
      await keycloakClient.getClient().users.addRealmRoleMappings({id: userid, roles: [{id: selectedRole.id as string, name: selectedRole.name as string}]});

      logger.info('KeyCloak -> Role Added to User in Keycloak!');
      return true;
  }

  toJSON() {
    return {
      user_id: this.user_id,
      username: this.username,
      email: this.email,
      role: this.role,
      isToken: this.isToken,
      token: this.token,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  hasValidToken() {
        if (!this.isToken) {
            return false;
        }
        if (!this.token || this.token.trim() === "") {
            return false;
            
        }
        // Additional token validation logic can be added here (e.g., regex pattern, length check)
        return true;
    }

    hasValidEmail() {
        if (!this.email || this.email.trim() === "") {
            return false;
        }
        // Simple email regex pattern for basic validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(this.email)) {
            return false;
        }
        return true;
    }
}