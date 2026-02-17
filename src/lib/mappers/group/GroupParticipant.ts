import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { config } from "@/lib/config";
import { KeycloakClient, KeycloakUser } from "@/lib/mappers/Users/keycloakclient";
import { ValidationError } from "@/lib/errors/appErrors";

/**
 * Group Participant mapper class representing a participant within a group.
 * Manages individual participant data including authentication tokens and roles.
 * 
 * @class GroupParticipant
 * @description Handles participant information within groups including token-based and user-based participants.
 * Supports both registered users and anonymous token-based participation.
 */
export class GroupParticipant {
    /**
     * ID of the group this participant belongs to
     */
    group_id: number;

    /**
     * Unique identifier for this participant
     */
    participant_id: number;
    
    /**
     * Username of the participant (may be token-generated)
     */
    username: string;
    
    /**
     * Authentication token for the participant
     */
    token: string;
    
    /**
     * Whether this participant uses token-based authentication
     */
    isToken: boolean;
    
    /**
     * Role of the participant within the group/study
     */
    role: string;
    
    /**
     * Email address of the participant
     */
    email: string;

    /**
     * Password for the participant account
     */
    password?: string;

    /**
     * Creates a new GroupParticipant instance
     * 
     * @param {any} data - Raw data object containing participant properties
     * @description Initializes participant properties and assigns additional dynamic properties.
     */
    constructor(data: any) {
        this.group_id = data.group_id;
        this.participant_id = data.participant_id;
        this.username = data.username;
        this.token = data.token;
        this.isToken = data.isToken;
        this.role = data.role;
        this.email = data.email;
    }

    static async getAllFromDbData(group_id : number) : Promise<GroupParticipant[]> {
        let participantsData = await db.Functions.runViewQuery(db.Views.GroupParticipant.byGroupId, {group_id: group_id});
        logger.debug({ participantsData }, `Group data retrieved for group ID ${group_id}`);
        return participantsData.map((participant: any) => new GroupParticipant(participant));
    }
    /**
      * Username of the participant (may be token-generated)
      */
    static async getFromDbData(group_id : number, participant_id: number) : Promise<GroupParticipant> {
        let participant = await db.Functions.runViewQuery(db.Views.GroupParticipant.byGroupIdAndUserId, {group_id: group_id, user_id : participant_id});
        if (!participant || participant.length === 0) {
            throw new ValidationError(`Participant with ID ${participant_id} not found in group ${group_id}`);
        }
        return new GroupParticipant(participant[0]);
    }

    static async createInDb(group_id: number, is_new_generation: boolean, body: any): Promise<GroupParticipant> {
        const isTokenUser = body?.isToken === true || body?.isToken === "true";
        const participantData: any = {
            isToken: isTokenUser,
            role: body?.role || "student",
        };

        if (isTokenUser) {
            const tokenValue = body?.token || body?.username;
            if (!tokenValue) {
                throw new ValidationError("Token is required when isToken is true");
            }
            participantData.token = tokenValue;
            participantData.username = is_new_generation ? `${group_id}_${tokenValue}` : tokenValue;
            participantData.email = body?.email || `${participantData.username}@example.com`;
            participantData.password = body?.token;
        } else {
            participantData.email = body?.email;
            participantData.username = body?.username;
            participantData.token = null;
            participantData.password = body?.password || null;
        }
        await GroupParticipant.addUserToKeycloak(group_id, participantData);
        let user = await db.Tables.User.create(participantData);
        logger.info(user, `Created user in database with username ${participantData.username} and email ${participantData.email}`);
        let participant = await db.Tables.GroupParticipants.create({participant_id : user.user_id , group_id });
        logger.info(participant, `Created participant in database with participant_id ${participant.participant_id} and group_id ${group_id}`);
        let participantCreated = await GroupParticipant.getFromDbData(group_id, participant.participant_id);
        return participantCreated;
    }

    async delete(keycloakDelete : boolean): Promise<void> {
        if(keycloakDelete) {
            this.removeUserToKeycloak();
        }
        await db.Tables.GroupParticipants.destroy({ where : { participant_id: this.participant_id}});
        if(this.isToken) {
            await db.Tables.User.destroy({ where : { user_id: this.participant_id}});
        }
    }

    /**
     * Prints debugging information about this participant instance
     * 
     * @returns {void}
     * @description Logs participant information to debug output for troubleshooting.
     */
    printInfo() {
        logger.debug({ GroupParticipant : this }, `GroupParticipant information - Group ID: ${this.group_id}, Participant ID: ${this.participant_id}, Username: ${this.username}, Role: ${this.role}`);
    }

    async removeUserToKeycloak() {
        if(this.role != "student" && !this.isToken) {
            return true;
        } else {
            logger.info('KeyCloak -> Auth');
            const keycloakClient = new KeycloakClient();
            await keycloakClient.initialize();
            await keycloakClient.AuthClient();
            var userid = await keycloakClient.findUserIdByUsername(this.username);
            logger.info('KeyCloak -> Remove user from group');
            try {
                await keycloakClient.removeUserFromGroup(userid, `group_${this.group_id}`);
            } catch(e) {
                logger.error(e);
                //throw { message: 'Failed removing the user from keycloak group' };
            }
            logger.info('KeyCloak -> Remove user from keycloak');
            try {
                await keycloakClient.removeUser(userid);
            } catch(e) {
                logger.error(e);
                throw { message: 'Failed removing the user into keycloak' };
            }

            logger.info('KeyCloak -> User removed from Keycloak!');
            return true;
        }
    }

    static async addUserToKeycloak(group_id : number, userData: Partial<GroupParticipant>) : Promise<boolean> {
        if(!config.sso.enabled){
            return true;
        }

        logger.info('KeyCloak -> Auth');
        const keycloakClient = new KeycloakClient();
        await keycloakClient.initialize();
        await keycloakClient.AuthClient();

        logger.info('KeyCloak -> Adding user');
        let user: KeycloakUser;
        try{
            user = await keycloakClient.addUser(userData);
        }catch(e){
            logger.error(e);
            throw { message: 'Failed creating the user into keycloak' };
        }

        logger.info('KeyCloak -> Adding user to Keycloak Group');
        if (!group_id) {
            throw { message: 'Group ID is not defined' };
        }
        await keycloakClient.addUserToGroup(user.id!, `group_${group_id}`);

        logger.info('KeyCloak -> getting Role Mappings');
        let roleMappings = await keycloakClient.getClient().users.listAvailableRealmRoleMappings({id: user.id!});

        let selectedRole;
        for (var i = roleMappings.length - 1; i >= 0; i--) {
            if(roleMappings[i].name === userData.role){
                selectedRole = roleMappings[i];
                break;
            }
        }

        if (!selectedRole) {
            throw { message: 'Role not found in available realm role mappings' };
        }

        logger.info('KeyCloak -> Adding Role to User');
        await keycloakClient.getClient().users.addRealmRoleMappings({id: user.id!, roles: [{id: selectedRole.id!, name: selectedRole.name!}]});

        logger.info('KeyCloak -> Setting up User Password');
        await keycloakClient.getClient().users.resetPassword({
            id: user.id!,
            credential: {
                temporary: false,
                type: 'password',
                value: userData.password,
            }
        });
        logger.info('KeyCloak -> User Added to Keycloak!');
        return true;
    }
}