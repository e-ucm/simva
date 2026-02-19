import { logger }from '@/lib/logger';
import axios from 'axios';
import { config } from '@/lib/config';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import { GroupParticipant } from '@/lib/mappers/group/GroupParticipant';
import { NotFoundError } from '@/lib/errors/appErrors';

interface KeycloakOption {
    data?: { enabled: string; url: any; secret: any; eventTypes: string[]; };
    url: string;
    method: string;
    headers: Record<string, string>;
}

export interface KeycloakUser {
    id?: string;
    username?: string;
    email?: string;
    enabled?: boolean;
}

export class KeycloakClient {
    client: KcAdminClient;
    KeycloakUserCredentials : Credentials;
    keycloakStatus: boolean;
    options : KeycloakOption;

    constructor() {
        let kcconfig = {
            baseUrl: config.sso.url,
            realmName: config.sso.realm
        };
        logger.info(kcconfig);
        // Instantiate the Keycloak client
        this.client = new KcAdminClient(kcconfig);

        this.KeycloakUserCredentials = {
            username: config.sso.adminUser,
            password: config.sso.adminPassword,
            grantType: 'password',
            clientId: 'admin-cli'
        };

        this.keycloakStatus = false;

        // Initialize request options as a class property
        this.options = {
            url: config.sso.webhookUrl,
            method: "POST",
            headers: {
                'user-agent': 'Apache-HttpClient/4.2.2 (java 1.5)',
                'connection': 'keep-alive',
                'content-type': 'application/json'
            }
        };
        logger.info('----- KEYCLOAK -----');
        logger.info('Keycloak-> Connecting to: ');
        logger.info(JSON.stringify(kcconfig, null, 2));
        logger.info('Keycloak-> Authentication: ');
        logger.info(JSON.stringify(this.KeycloakUserCredentials, null, 2));
        logger.info('--------------------');
    }

    async initialize() : Promise<void> {
        try {
            if (config.sso.enabled) {
                try {
                    await this.client.auth(this.KeycloakUserCredentials);
                    logger.info(this.client.getAccessToken());
                    logger.info('Connected to Keycloak!');
                    this.keycloakStatus = true;
                } catch (error) {
                    logger.info('Unable to connect to Keycloak');
                    logger.error(error);
                    this.keycloakStatus = false;
                }
            }
        } catch (error) {
            console.error('Failed to initialize Keycloak client:', error);
        }
    }

    async AuthClient() : Promise<void> {
        await this.client.auth(this.KeycloakUserCredentials);
    }

    /**
     * Adds a user to a Keycloak group, creating the group if it doesn't exist.
     * @param {string} userId - The ID of the user to add to the group.
     * @param {string} groupName - The name of the group.
     * @returns {Promise<void>}
     */
    async addUserToGroup(userId : string, groupName : string) : Promise<void> {
        try {
            // Ensure the client is authenticated
            await this.AuthClient();

            // Fetch all groups to find the group ID by name
            logger.info(`Keycloak -> Searching for group: ${groupName}`);
            const groups = await this.client.groups.find({ search: groupName });
            logger.info(groups);
            let group = groups.find(g => g.name === groupName);

            // If the group does not exist, create it
            if (!group) {
                logger.info(`Group '${groupName}' does not exist. Creating it...`);

                const newGroup = await this.client.groups.create({
                    name: groupName
                });

                // Keycloak API returns the group details, including the ID
                group = newGroup;
                logger.info(`Group '${groupName}' created with ID: ${group.id}`);
            }

            const groupId = group.id!;

            // Add the user to the group
            await this.client.users.addToGroup({
                id: userId,      // User ID
                groupId: groupId // Group ID
            });

            logger.info(`User ${userId} added to group '${groupName}' successfully.`);
        } catch (error) {
            logger.error(error, `Error adding user ${userId} to group '${groupName}':`);
            throw error;
        }
    }

    /**
     * Removes a user from a Keycloak group.
     * @param {string} userId - The ID of the user to remove from the group.
     * @param {string} groupName - The name of the group.
     * @returns {Promise<void>}
     */
    async removeUserFromGroup(userId: string, groupName : string) : Promise<void> {
        try {
            // Ensure the client is authenticated
            await this.AuthClient();

            // Fetch all groups to find the group ID by name
            const groups = await this.client.groups.find();
            const group = groups.find(g => g.name === groupName);

            if (!group) {
                logger.warn(`Group '${groupName}' does not exist. Cannot remove user.`);
                return; // Exit early if the group doesn't exist
            }

            const groupId = group.id!;

            // Remove the user from the group
            await this.client.users.delFromGroup({
                id: userId,      // User ID
                groupId: groupId // Group ID
            });

            logger.info(`User ${userId} removed from group '${groupName}' successfully.`);
        } catch (error) {
            logger.error(error, `Error removing user ${userId} from group '${groupName}':`);
            throw error;
        }
    }

    /**
     * Adds a user to Keycloak.
     * @param {Object} params - Parameters for creating the user.
     * @param {string} params.username - The username for the new user.
     * @param {string} params.email - The email address for the user.
     * @param {boolean} [params.isToken=false] - Whether the user is related to token generation.
     * @param {boolean} [params.useNewGeneration=false] - Whether to use a new naming scheme.
     * @param {string} [params.groupid] - The group ID to prepend if `useNewGeneration` is true.
     * @returns {Promise<Object>} - The created Keycloak user object.
     */
    async addUser(params : Partial<GroupParticipant>) : Promise<KeycloakUser> {
        if (!params || !params.username || !params.email) {
            throw new Error("Missing required parameters: 'username' and 'email' are mandatory.");
        }

        try {
            // Authenticate the client
            await this.AuthClient();

            logger.info('Keycloak -> Adding user');

            // Create the user in Keycloak
            const user = await this.client.users.create({
                username: params.username,
                email: params.email,
                enabled: true, // User account is active by default
            });

            logger.info(`Keycloak -> User '${params.username}' created successfully.`);
            return user; // Return the user object for further use
        } catch (error) {
            logger.error(error, 'Error adding user to Keycloak:');
            throw {
                message: 'Failed creating the user in Keycloak',
                originalError: error,
            };
        }
    }

    /**
     * Finds a user's ID in Keycloak by their username.
     * @param {string} username - The username of the user.
     * @returns {Promise<string>} - The user's ID if found, otherwise throws an error.
     */
    async findUserIdByUsername(username : string) : Promise<string> {
        if (!username) {
            throw new Error("Username is required to find the user ID.");
        }

        try {
            // Ensure the client is authenticated
            await this.AuthClient();

            logger.info(`Keycloak -> Searching for user ID by username: ${username}`);

            // Fetch users matching the username
            const users = await this.client.users.find({ username });

            if (!users || users.length === 0) {
                throw new Error(`User with username '${username}' not found.`);
            }

            // Assuming usernames are unique in Keycloak, return the first match
            const user = users[0];
            logger.info(`Keycloak -> User found: ${user.id}`);
            if(user && user.id) {
                return user.id;
            } else {
                throw new NotFoundError(`Failed to find user ID for username '${username}'`);
            }
        } catch (error) {
            logger.error(error, `Error finding user ID for username '${username}':`);
            throw new NotFoundError(`Failed to find user ID for username '${username}'`);
        }
    }


    /**
     * Deletes a user from Keycloak.
     * @param {string} userId - The ID of the user to delete.
     * @returns {Promise<void>}
     */
    async removeUser(userId : string) : Promise<void> {
        try {
            // Ensure the client is authenticated
            await this.AuthClient();

            // Attempt to delete the user
            await this.client.users.del({
                id: userId // User ID
            });

            logger.info(`User with ID ${userId} successfully deleted from Keycloak.`);
        } catch (error) {
            logger.error(error, `Error deleting user with ID ${userId}:`);
            throw error;
        }
    }

    getClient() {
        return this.client;
    }

    getStatus() {
        return this.keycloakStatus;
    }

    createWebhook(callback : Function) {
        if (!this.client) {
            callback({ message: 'Client is not initialized' });
            return;
        }

        let accessToken = this.client.getAccessToken();
        logger.info('AccessToken: ' + accessToken);
        
        this.options.headers.Authorization = 'Bearer ' + accessToken;
        this.options.data = {
            "enabled": "true",
            "url": config.api.webhookPath,
            "secret": config.api.webhookSecret,
            "eventTypes": ["*"]
        };

        axios(this.options)
            .then(response => {
                    if (response.status == 200) {
                        logger.info(JSON.stringify(response));
                        callback(null);
                    } else {
                        logger.info(JSON.stringify(response));
                        callback({ message: 'Error on SSO webhook Initialization' });
                    }
                })
			.catch(error => {
                logger.error(error, 'Exception on SSO webhook Initialization');
                callback({ message: 'Exception on SSO webhook Initialization', error: error });
            });
    }
}
