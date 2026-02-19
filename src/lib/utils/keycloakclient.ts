import { logger } from '@/lib/logger';
import axios, { AxiosResponse } from 'axios';
import { config } from '@/lib/config';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
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

interface GroupCache {
    [groupName: string]: { id: string; timestamp: number };
}

interface CreateUserParams {
    username: string;
    email: string;
    enabled?: boolean;
}

export class KeycloakClient {
    private client: KcAdminClient;
    private KeycloakUserCredentials: Credentials;
    private keycloakStatus: boolean = false;
    private options: KeycloakOption;
    private lastAuthTime: number = 0;
    private authCacheDuration: number = 280000; // 280 seconds (5 minutes - 20 seconds buffer)
    private groupCache: GroupCache = {};
    private groupCacheDuration: number = 300000; // 5 minutes
    private ssoConfig: any;

    constructor(ssoConfig: any) {
        let kcconfig = {
            baseUrl: ssoConfig.url,
            realmName: ssoConfig.realm
        };
        logger.info(kcconfig);
        // Instantiate the Keycloak client
        this.client = new KcAdminClient(kcconfig);
        this.ssoConfig = ssoConfig;

        // Set up admin credentials for authentication

        this.KeycloakUserCredentials = {
            username: ssoConfig.adminUser,
            password: ssoConfig.adminPassword,
            grantType: 'password',
            clientId: 'admin-cli'
        };

        // Initialize request options as a class property
        this.options = {
            url: ssoConfig.webhookUrl,
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
            if (this.ssoConfig.enabled) {
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

    /**
     * Authenticate client with caching to avoid unnecessary auth calls
     */
    private async ensureAuthenticated(): Promise<void> {
        const now = Date.now();
        if (now - this.lastAuthTime < this.authCacheDuration) {
            return; // Still authenticated
        }
        
        try {
            await this.client.auth(this.KeycloakUserCredentials);
            this.lastAuthTime = now;
            this.keycloakStatus = true;
        } catch (error) {
            this.keycloakStatus = false;
            logger.error(error, 'Failed to authenticate Keycloak client');
            throw new Error('Keycloak authentication failed');
        }
    }

    /**
     * Find group by name with caching
     */
    private async findGroupByName(groupName: string): Promise<GroupRepresentation | null> {
        // Check cache first
        const cached = this.groupCache[groupName];
        const now = Date.now();
        
        if (cached && (now - cached.timestamp < this.groupCacheDuration)) {
            // Return cached group (we need to fetch it again, but we have the ID)
            try {
                const group = await this.client.groups.findOne({ id: cached.id });
                return group || null;
            } catch {
                // Cache miss, remove from cache
                delete this.groupCache[groupName];
            }
        }

        // Fetch from Keycloak
        const groups = await this.client.groups.find({ search: groupName });
        const group = groups.find(g => g.name === groupName) || null;
        
        // Cache the result
        if (group && group.id) {
            this.groupCache[groupName] = { id: group.id, timestamp: now };
        }
        
        return group;
    }

    /**
     * Create group if it doesn't exist
     */
    private async createGroupIfNotExists(groupName: string): Promise<GroupRepresentation> {
        let group = await this.findGroupByName(groupName);
        
        if (!group) {
            logger.info(`Group '${groupName}' does not exist. Creating it...`);
            
            const newGroup = await this.client.groups.create({ name: groupName });
            group = newGroup;
            
            // Update cache
            if (group.id) {
                this.groupCache[groupName] = { id: group.id, timestamp: Date.now() };
            }
            
            logger.info(`Group '${groupName}' created with ID: ${group.id}`);
        }
        
        return group;
    }

    /**
     * Validate user input parameters
     */
    private validateUserParams(params: any, requiredFields: string[]): void {
        if (!params) {
            throw new Error('Parameters are required');
        }
        
        for (const field of requiredFields) {
            if (!params[field]) {
                throw new Error(`Missing required parameter: '${field}'`);
            }
        }
    }

    /**
     * Adds a user to a Keycloak group, creating the group if it doesn't exist.
     * @param {string} userId - The ID of the user to add to the group.
     * @param {string} groupName - The name of the group.
     * @returns {Promise<void>}
     */
    async addUserToGroup(userId: string, groupName: string): Promise<void> {
        this.validateUserParams({ userId, groupName }, ['userId', 'groupName']);
        
        try {
            await this.ensureAuthenticated();
            
            logger.info(`Keycloak -> Adding user ${userId} to group: ${groupName}`);
            
            const group = await this.createGroupIfNotExists(groupName);
            
            if (!group.id) {
                throw new Error(`Failed to get group ID for '${groupName}'`);
            }

            await this.client.users.addToGroup({
                id: userId,
                groupId: group.id
            });

            logger.info(`User ${userId} added to group '${groupName}' successfully.`);
        } catch (error) {
            logger.error(error, `Error adding user ${userId} to group '${groupName}':`);
            throw new Error(`Failed to add user to group: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Removes a user from a Keycloak group.
     * @param {string} userId - The ID of the user to remove from the group.
     * @param {string} groupName - The name of the group.
     * @returns {Promise<void>}
     */
    async removeUserFromGroup(userId: string, groupName: string): Promise<void> {
        this.validateUserParams({ userId, groupName }, ['userId', 'groupName']);
        
        try {
            await this.ensureAuthenticated();
            
            logger.info(`Keycloak -> Removing user ${userId} from group: ${groupName}`);
            
            const group = await this.findGroupByName(groupName);
            
            if (!group || !group.id) {
                logger.warn(`Group '${groupName}' does not exist. Cannot remove user.`);
                return;
            }

            await this.client.users.delFromGroup({
                id: userId,
                groupId: group.id
            });

            logger.info(`User ${userId} removed from group '${groupName}' successfully.`);
        } catch (error) {
            logger.error(error, `Error removing user ${userId} from group '${groupName}':`);
            throw new Error(`Failed to remove user from group: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Adds a user to Keycloak.
     * @param {Object} params - Parameters for creating the user.
     * @param {string} params.username - The username for the new user.
     * @param {string} params.email - The email address for the user.
     * @param {boolean} [params.enabled=true] - Whether the user account should be enabled.
     * @returns {Promise<UserRepresentation>} - The created Keycloak user object.
     */
    async addUser(params: CreateUserParams): Promise<UserRepresentation> {
        // Type guard and adapter for backward compatibility
        const userData: CreateUserParams = {
            username: params.username || '',
            email: params.email || '',
            enabled: true
        };
        
        this.validateUserParams(userData, ['username', 'email']);
        
        try {
            await this.ensureAuthenticated();
            
            logger.info(`Keycloak -> Adding user: ${userData.username}`);
            
            const userPayload = {
                username: userData.username.trim(),
                email: userData.email.trim().toLowerCase(),
                enabled: userData.enabled ?? true,
                emailVerified: true
            };
            
            const user = await this.client.users.create(userPayload);
            
            logger.info(`Keycloak -> User '${userData.username}' created successfully with ID: ${user.id}`);
            return user;
        } catch (error) {
            logger.error(error, `Error adding user '${userData.username}' to Keycloak:`);
            throw new Error(`Failed to create user in Keycloak: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Finds a user's ID in Keycloak by their username.
     * @param {string} username - The username of the user.
     * @returns {Promise<string>} - The user's ID if found.
     * @throws {NotFoundError} - When user is not found.
     */
    async findUserIdByUsername(username: string): Promise<string> {
        this.validateUserParams({ username }, ['username']);
        
        try {
            await this.ensureAuthenticated();
            
            logger.info(`Keycloak -> Searching for user ID by username: ${username}`);
            
            const users = await this.client.users.find({ 
                username: username.trim(),
                exact: true // Exact match for better performance
            });
            
            if (!users?.length) {
                throw new NotFoundError(`User with username '${username}' not found`);
            }
            
            const user = users[0];
            if (!user.id) {
                throw new NotFoundError(`User '${username}' found but has no ID`);
            }
            
            logger.info(`Keycloak -> User found: ${user.id}`);
            return user.id;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            logger.error(error, `Error finding user ID for username '${username}':`);
            throw new NotFoundError(`Failed to find user ID for username '${username}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }


    /**
     * Deletes a user from Keycloak.
     * @param {string} userId - The ID of the user to delete.
     * @returns {Promise<void>}
     */
    async removeUser(userId: string): Promise<void> {
        this.validateUserParams({ userId }, ['userId']);
        
        try {
            await this.ensureAuthenticated();
            
            logger.info(`Keycloak -> Deleting user with ID: ${userId}`);
            
            await this.client.users.del({ id: userId });
            
            logger.info(`User with ID ${userId} successfully deleted from Keycloak.`);
        } catch (error) {
            logger.error(error, `Error deleting user with ID ${userId}:`);
            throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    getClient() {
        return this.client;
    }

    getStatus() {
        return this.keycloakStatus;
    }

    /**
     * Create webhook configuration for Keycloak events
     * @returns {Promise<void>}
     */
    async createWebhookAsync(): Promise<void> {
        if (!this.client) {
            throw new Error('Client is not initialized');
        }
        
        try {
            await this.ensureAuthenticated();
            
            const accessToken = this.client.getAccessToken();
            if (!accessToken) {
                throw new Error('No access token available');
            }
            
            logger.info('Keycloak -> Creating webhook configuration');
            
            const webhookData = {
                enabled: true,
                url: config.api.webhookPath,
                secret: config.api.webhookSecret,
                eventTypes: ['*']
            };
            
            const webhookOptions = {
                ...this.options,
                headers: {
                    ...this.options.headers,
                    Authorization: `Bearer ${accessToken}`
                },
                data: webhookData
            };
            
            const response: AxiosResponse = await axios(webhookOptions);
            
            if (response.status === 200) {
                logger.info('SSO webhook initialization successful');
            } else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
        } catch (error) {
            logger.error(error, 'Exception on SSO webhook initialization');
            throw new Error(`Failed to create webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Create webhook with callback for backward compatibility
     */
    createWebhook(callback: (error: any, result?: any) => void): void {
        this.createWebhookAsync()
            .then(() => callback(null))
            .catch(error => callback(error));
    }
}

const keycloakClient = new KeycloakClient(config.sso);
export { keycloakClient };
export default KeycloakClient;
