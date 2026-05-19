import { db } from "@/lib/db";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { keycloakClient, KeycloakUser } from "@/lib/utils/keycloakclient";
import { config } from "@/lib/config";
import { Session } from "@/lib/mappers/session/Session";

/**
 * Simlet Participant mapper class representing a participant within a study (simlet).
 * Combines participant data with their allocation and group assignment information.
 * 
 * @class SimletParticipant
 * @description Manages participant data within the context of a specific study,
 * including allocation strategy and group membership details.
 */
export class SimletParticipant {
    /**
     * ID of the simlet (study) this participant is enrolled in
     */
    simlet_id: number;
    
    /**
     * ID of the session used to assign this participant
     */
    session_id: number;
    
    /**
     * ID of the group this participant belongs to
     */
    group_id: number;
    
    /**
     * Unique identifier for this participant
     */
    user_id: number;
    
    /**
     * Username of the participant
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
     * Role of the participant within the study
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

    createdAt?: Date;

    updatedAt?: Date;

    /**
     * Creates a new SimletParticipant instance
     * 
     * @param {any} data - Raw data object containing participant and study context properties
     * @description Initializes participant data including study context, allocation, and group information.
     * Logs participant data for debugging purposes.
     */
    constructor(data: any) {
        this.simlet_id = data.simlet_id;
        this.session_id = data.session_id;
        this.group_id = data.group_id;
        this.user_id = data.user_id;
        this.username = data.username;
        this.token = data.token;
        this.isToken = Boolean(data.isToken);
        this.role = data.role;
        this.email = data.email;
        this.password = data.password;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
    }

    static async getGroupAllFromDbData(group_id : number) : Promise<SimletParticipant[]> {
        let participantsData = await db.Functions.runViewQuery(db.Views.GroupParticipant.byGroupId, {group_id: group_id});
        logger.debug({ participantsData }, `Group data retrieved for group ID ${group_id}`);
        return participantsData.map((participant: any) => new SimletParticipant(participant));
    }

    static async resetAssignedUserToSession(simlet_id: number, session_id: number): Promise<void> {
        const default_session_id = await Session.getDefaultSessionId(simlet_id, session_id);
        if(default_session_id === -1) {
            logger.warn(`No default session found for simlet ${simlet_id}. Participants will be unassigned from any session.`);
            await db.Tables.ExperimentalParticipants.destroy({ where: { simlet_id: simlet_id, session_id: session_id } });
        } else {
            await db.Tables.ExperimentalParticipants.update({ session_id: default_session_id }, { where: { simlet_id: simlet_id, session_id: session_id } });
        }
        logger.info(`Reset session assignment for participants from session ${session_id} to default session ${default_session_id}`);
    }

    /**
      * Username of the participant (may be token-generated)
      */
    static async getFromDbData(group_id : number, user_id: number) : Promise<SimletParticipant> {
        let participant = await db.Functions.runViewQuery(db.Views.GroupParticipant.byGroupIdAndUserId, {group_id: group_id, user_id : user_id});
        if (!participant || participant.length === 0) {
            throw new NotFoundError(`Participant with ID ${user_id} not found in group ${group_id}`);
        }
        return new SimletParticipant(participant[0]);
    }

    static async getAllFromDbData(type: string, object_id: number): Promise<SimletParticipant[]> {
        let allocated;
        if(type === 'simlet') {
            allocated = await db.Functions.runViewQuery(
              db.Views.AllocatedParticipants.bySimletId,
              { simlet_id: object_id }
            );
        } else if(type === 'session') {
            allocated = await db.Functions.runViewQuery(
              db.Views.AllocatedParticipants.bySessionId,
              { session_id: object_id }
            );
        } else {
            throw new BadRequestError(`Invalid type: ${type}`);
        }
        logger.debug({allocated} , "Participants data from view");
        return allocated.map((participant: any) => new SimletParticipant(participant));
    }
    
    static async createInDb(simlet_id: number, group_id: number, is_new_generation: boolean, body: any): Promise<SimletParticipant> {
        const isTokenUser = body?.isToken === true || body?.isToken === "true";
        const participantData: any = {
            isToken: isTokenUser,
            role: body?.role || "student",
        };

        if (isTokenUser) {
            const tokenValue = body?.token || body?.username;
            if (!tokenValue) {
                throw new BadRequestError("Token is required when isToken is true");
            }
            participantData.token = tokenValue;
            participantData.username = is_new_generation ? `${simlet_id}_${tokenValue}` : tokenValue;
            participantData.email = body?.email || `${participantData.username}@example.com`;
            participantData.password = body?.token;
        } else {
            participantData.email = body?.email;
            participantData.username = body?.username;
            participantData.token = null;
            participantData.password = body?.password || null;
        }
        await SimletParticipant.addUserToKeycloak(group_id, participantData);
        let user = await db.Tables.User.create(participantData);
        logger.info(user, `Created user in database with username ${participantData.username} and email ${participantData.email}`);
        let participant = await db.Tables.GroupParticipants.create({participant_id : user.user_id , group_id });
        logger.info(participant, `Created participant in database with participant_id ${participant.participant_id} and group_id ${group_id}`);
        let participantCreated = await SimletParticipant.getFromDbData(group_id, participant.participant_id);
        return participantCreated;
    }

    static async addToGroup(group_id: number, user_id: number): Promise<void> {
        let participantIndex = await db.Tables.GroupParticipants.findOne({ where: { group_id: group_id, participant_id: user_id } });
        if(participantIndex) {
            throw new ConflictError(`Participant with ID ${user_id} is already in the group`);
        }
        await db.Tables.GroupParticipants.create({ participant_id: user_id, group_id: group_id });
    }

    /**
     * Deletes this participant from the group and optionally from Keycloak.
     * Also removes from database and cleans up token-based users.
     * 
     * @async
     * @method delete
     * @param {boolean} keycloakDelete - Whether to also remove from Keycloak authentication system
     * @returns {Promise<void>} Promise that resolves when deletion is complete
     */
    async delete(keycloakDelete : boolean): Promise<void> {
        if(keycloakDelete) {
            this.removeUserToKeycloak();
        }
        await db.Tables.GroupParticipants.destroy({ where : { group_id: this.group_id, participant_id: this.user_id}});
        if(this.isToken) {
            await db.Tables.User.destroy({ where : { user_id: this.user_id }});
        }
    }

    /**
     * Removes this participant's user account from Keycloak authentication system.
     * Only removes non-student and non-token users from Keycloak groups and user store.
     * 
     * @async
     * @method removeUserToKeycloak
     * @returns {Promise<boolean>} Promise resolving to true when removal is successful
     * @throws {object} When user removal from Keycloak fails
     */
    async removeUserToKeycloak(): Promise<boolean> {
        if(this.role != "student" && !this.isToken) {
            return true;
        } else {
            logger.info('KeyCloak -> Auth');
            await keycloakClient.initialize();
            var userid = await keycloakClient.findUserIdByUsername(this.username);
            logger.info('KeyCloak -> Remove user from group');
            try {
                await keycloakClient.removeUserFromGroup(userid, `group_${this.group_id}`);
            } catch(e) {
                logger.warn(e);
            }
            logger.info('KeyCloak -> Remove user from keycloak');
            await keycloakClient.removeUser(userid);

            logger.info('KeyCloak -> User removed from Keycloak!');
            return true;
        }
    }

    static async addUserToKeycloak(group_id : number, userData: Partial<SimletParticipant>) : Promise<boolean> {
        if(!config.sso.enabled){
            return true;
        }

        logger.info('KeyCloak -> Auth');
        await keycloakClient.initialize();

        logger.info('KeyCloak -> Adding user');
        let user: KeycloakUser;
        user = await keycloakClient.addUser({ username: userData.username!, email: userData.email!, enabled: true });
        if (!user || !user.id) {
            throw new NotFoundError('Failed creating the user into keycloak');
        }

        logger.info('KeyCloak -> Adding user to Keycloak Group');
        if (!group_id) {
            throw new NotFoundError('Group ID is not defined');
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
            throw new NotFoundError('Role not found in available realm role mappings');
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

    printInfo() {
        logger.debug({ SimletParticipant : this }, `SimletParticipant information - Simlet ID: ${this.simlet_id}, Allocator ID: ${this.allocator_id}, Group ID: ${this.group_id}, Participant ID: ${this.user_id}, Username: ${this.username}, Role: ${this.role}`);
    }

    toJSON(): object {
        return {
            simlet_id: this.simlet_id,
            session_id: this.session_id,
            group_id: this.group_id,
            user_id: this.user_id,
            username: this.username,
            token: this.token,
            isToken: this.isToken,
            role: this.role,
            email: this.email,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}