const logger = require('../logger');
const request = require('request');
const config = require('../config');

class KeycloakClient {
    constructor() {
        this.KcAdminClient = null;
        this.client = null;
        this.KeycloakUserCredentials = null;
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
    }

    static async getClient() {
        if (!this.KcAdminClient) {
            const module = await import('@keycloak/keycloak-admin-client');
            this.KcAdminClient = module.default;
        }
        return this.KcAdminClient;
    }

    async initialize() {
        try {
            const KcAdminClient = await KeycloakClient.getClient(); // Use static method
            logger.info(KcAdminClient);

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

            logger.info('----- KEYCLOAK -----');
            logger.info('Keycloak-> Connecting to: ');
            logger.info(JSON.stringify(kcconfig, null, 2));
            logger.info('Keycloak-> Authentication: ');
            logger.info(JSON.stringify(this.KeycloakUserCredentials, null, 2));
            logger.info('--------------------');

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

    async AuthClient() {
        await this.client.auth(this.KeycloakUserCredentials);
    }

    getClient() {
        return this.client;
    }

    getStatus() {
        return this.keycloakStatus;
    }

    createWebhook(callback) {
        if (!this.client) {
            callback({ message: 'Client is not initialized' });
            return;
        }

        let accessToken = this.client.getAccessToken();
        logger.info('AccessToken: ' + accessToken);
        
        this.options.headers.Authorization = 'Bearer ' + accessToken;
        this.options.body = {
            "enabled": "true",
            "url": config.api.webhookPath,
            "secret": config.api.webhookSecret,
            "eventTypes": ["*"]
        };

        request(this.options, function (error, response, body) {
            try {
                if (!error && response.statusCode == 200) {
                    logger.info(JSON.stringify(response));
                    callback(null);
                } else {
                    logger.info(JSON.stringify(response));
                    logger.info(JSON.stringify(body));
                    callback({ message: 'Error on SSO webhook Initialization', error: error });
                }
            } catch (e) {
                logger.error('Exception on SSO webhook Initialization');
                logger.error(JSON.stringify(e));
                callback({ message: 'Exception on SSO webhook Initialization', error: e });
            }
        });
    }
}

module.exports = KeycloakClient;
