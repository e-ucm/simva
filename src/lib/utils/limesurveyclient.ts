/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union's Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { NotFoundError } from '../errors/appErrors';

// ============================================================================
// Interfaces
// ============================================================================

export interface LimeSurveyOptions extends AxiosRequestConfig {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    data?: any;
}

export interface Survey {
    sid?: number | string;
    name?: string;
    description?: string;
    active?: string;
    [key: string]: any;
}

export interface Participant {
    email: string;
    firstname: string;
    lastname: string;
    token: string;
}

export interface SurveyLanguages {
    default: string;
    list: string[];
}

export interface OwnershipResult {
    isOwner: boolean;
}

export interface LimeSurveyResponse {
    result?: any;
    error?: any;
    id?: number;
}

// ============================================================================
// LimeSurveyClient Class
// ============================================================================

/**
 * LimeSurvey API Client - provides a clean interface for interacting with LimeSurvey Remote Control API
 * 
 * Features:
 * - Session management with automatic token refresh
 * - Both Promise-based and callback-based methods for backward compatibility
 * - Configurable logging
 * - Error handling with descriptive messages
 */
export class LimeSurveyClient {
    private sessionKey: string = '';
    private sessionTimestamp: number = 0;
    private readonly sessionDuration: number = 280; // 280 seconds (5 min - 20 sec buffer)
    private options: LimeSurveyOptions;
    private username: string;
    private password: string;
    private debug: boolean;
    private readonly useNewVersion: boolean;

    constructor(options?: Partial<{
        url: string;
        username: string;
        password: string;
        debug: boolean;
    }>) {
        const lsConfig = config.limesurvey;
        
        this.options = {
            url: options?.url || `${lsConfig.external_url}/index.php/admin/remotecontrol`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        this.username = options?.username || lsConfig.adminUser;
        this.password = options?.password || lsConfig.adminPassword;
        this.debug = options?.debug ?? true;
        this.useNewVersion = lsConfig.useNewVersion || false;
        
        this.log('LimeSurveyClient initialized');
    }

    // ========================================================================
    // Private Utility Methods
    // ========================================================================

    private log(message: any): void {
        if (this.debug) {
            logger.info(message);
        }
    }

    private logMultiple(data: Record<string, any>): void {
        Object.entries(data).forEach(([key, value]) => {
            this.log(`--> ${key}:`);
            this.log(value);
        });
    }

    private normalizeSurveyDate(value: unknown): string | null {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (typeof value !== 'string') {
            return null;
        }

        const parsedDate = new Date(value.includes('T') ? value : value.replace(' ', 'T'));

        if (Number.isNaN(parsedDate.getTime())) {
            return null;
        }

        return parsedDate.toISOString();
    }

    private normalizeSurveyDates(survey: Survey): Survey {
        return {
            ...survey,
            startdate: this.normalizeSurveyDate(survey.startdate),
            expires: this.normalizeSurveyDate(survey.expires)
        };
    }

    private handleError(methodName: string, error: any): never {
        this.log(`LimeSurveyClient.${methodName} -> ERROR:`);
        this.log(error);
        throw { message: `Error in ${methodName}`, error };
    }

    private decodeBase64Response(result: string): any {
        return JSON.parse(Buffer.from(result, 'base64').toString());
    }

    private async request<T = any>(method: string, params: any[]): Promise<T> {
        const requestData = { method, params, id: 1 };
        
        try {
            const response: AxiosResponse<LimeSurveyResponse> = await axios({
                ...this.options,
                data: requestData
            });
            
            if (response.data.error) {
                throw { message: response.data.error };
            }
            
            return response.data.result;
        } catch (error: any) {
            if (error.response) {
                throw { message: `HTTP ${error.response.status}`, error: error.response.data };
            }
            throw error;
        }
    }

    // ========================================================================
    // Authentication Methods
    // ========================================================================

    /**
     * Ensure the client is authenticated, refreshing token if necessary
     */
    async ensureAuthenticated(): Promise<void> {
        const now = Math.floor(Date.now() / 1000);
        
        if (this.sessionKey && (now - this.sessionTimestamp) < this.sessionDuration) {
            return; // Session still valid
        }
        
        if (this.sessionKey) {
            // Release old session before getting new one
            await this.releaseSessionToken().catch(() => {});
        }
        
        await this.updateAuthToken();
    }

    private async updateAuthToken(): Promise<void> {
        this.log('LimeSurveyClient.updateAuthToken -> Started');
        
        const result = await this.request<string>('get_session_key', [this.username, this.password]);
        
        if (typeof result === 'object' && (result as any).status) {
            throw { message: 'Authentication failed', error: (result as any).status };
        }
        
        this.sessionKey = result;
        this.sessionTimestamp = Math.floor(Date.now() / 1000);
        
        this.log(`LimeSurveyClient.updateAuthToken -> New key: ${this.sessionKey}`);
    }

    private async releaseSessionToken(): Promise<void> {
        this.log('LimeSurveyClient.releaseSessionToken -> Started');
        
        try {
            await this.request('release_session_key', [this.sessionKey]);
            this.sessionKey = '';
            this.sessionTimestamp = 0;
            this.log('LimeSurveyClient.releaseSessionToken -> Key released');
        } catch (error) {
            this.log('LimeSurveyClient.releaseSessionToken -> Error releasing key');
        }
    }

    // ========================================================================
    // Health Check
    // ========================================================================

    /**
     * Check if LimeSurvey service is online
     */
    async isOnline(): Promise<boolean> {
        try {
            await axios({ ...this.options, data: {} });
            return true;
        } catch (error: any) {
			logger.error(error, 'LimeSurveyClient.isOnline -> Error checking online status:');
            // LimeSurvey returns 500 for empty requests when online
            if (error.response?.status === 500 || error.status === 500) {
                return true;
            }
            return false;
        }
    }

    // ========================================================================
    // User Management
    // ========================================================================
    /**
     * Get user by username
     */
    async getUser(username: string): Promise<any> {
        this.log('LimeSurveyClient.getUser -> Started');
        
        await this.ensureAuthenticated();
        const result = await this.request('list_users', [this.sessionKey, null, username]);
        
        this.log('LimeSurveyClient.getUser -> Completed');
        return result;
    }

    /**
     * Get user ID by username
     */
    async getUserIdByUsername(username: string): Promise<number> {
        this.log('LimeSurveyClient.getUserIdByUsername -> Started');
        
        await this.ensureAuthenticated();
        const users = await this.request<any[]>('list_users', [this.sessionKey]);
        
        const user = users.find(u => u.users_name === username);
        
        if (!user) {
            throw { message: 'User not found in Limesurvey' };
        }
        
        this.log('LimeSurveyClient.getUserIdByUsername -> Completed');
        return user.uid;
    }

    // ========================================================================
    // Survey Management
    // ========================================================================

    /**
     * Create a new survey from LSS format
     */
    async createSurvey(surveyData: string): Promise<number> {
        this.log('LimeSurveyClient.createSurvey -> Started');
        
        await this.ensureAuthenticated();
        
        // Import survey
        const surveyId = await this.request<number>('import_survey', [this.sessionKey, surveyData, 'lss']);
        
        this.log(`LimeSurveyClient.createSurvey -> Completed with ID: ${surveyId}`);
        return surveyId;
    }

    /**
     * Clone an existing survey
     */
    async cloneSurvey(surveyId: number | string, newName?: string): Promise<number> {
        this.log('LimeSurveyClient.cloneSurvey -> Started');
        
        await this.ensureAuthenticated();
        
        const result = await this.request<{ newsid: number } | number>('copy_survey', [
            this.sessionKey,
            surveyId,
            newName,
            ['copysurveyexcludepermissions', 'copysurveyresetstartenddate']
        ]);
        
        const newSurveyId = typeof result === 'object' ? result.newsid : result;
        
        this.log(`LimeSurveyClient.cloneSurvey -> Completed with ID: ${newSurveyId}`);
        return newSurveyId;
    }

    /**
     * Export survey structure
     */
    async exportSurvey(surveyId: number | string): Promise<any> {
        this.log('LimeSurveyClient.exportSurvey -> Started');
        
        await this.ensureAuthenticated();
        const result = await this.request('export_survey_structure', [this.sessionKey, surveyId]);
        
        this.log('LimeSurveyClient.exportSurvey -> Completed');
        return result;
    }

    /**
     * Delete a survey
     */
    async deleteSurvey(surveyId: number | string): Promise<void> {
        this.log(`LimeSurveyClient.deleteSurvey -> Deleting: ${surveyId}`);
        
        await this.ensureAuthenticated();
        await this.request('delete_survey', [this.sessionKey, surveyId]);
        
        this.log('LimeSurveyClient.deleteSurvey -> Completed');
    }

    /**
     * Get survey by ID
     */
    async getSurvey(surveyId: number | string): Promise<Survey | null> {
        this.log('LimeSurveyClient.getSurvey -> Started');
        
        await this.ensureAuthenticated();
        const surveys = await this.request<Survey[]>('list_surveys', [this.sessionKey]);
        
        const survey = surveys.find(s => s.sid == surveyId);
        
        if (!survey) {
            this.log('LimeSurveyClient.getSurvey -> Survey not found');
            return null;
        }
        
        this.log('LimeSurveyClient.getSurvey -> Completed');
        return this.normalizeSurveyDates(survey);
    }

    /**
     * Get all surveys
     */
    async getSurveyList(): Promise<Survey[]> {
        this.log('LimeSurveyClient.getSurveyList -> Started');
        
        await this.ensureAuthenticated();
        const result = await this.request<Survey[]>('list_surveys', [this.sessionKey]);
        if (result instanceof Array === false) {
            throw new NotFoundError('No surveys found');
        }
        const surveys = result.map((survey) => this.normalizeSurveyDates(survey));
        
        this.log('LimeSurveyClient.getSurveyList -> Completed');
        return surveys;
    }

    /**
     * Get surveys owned by a specific user
     */
    async getSurveysFromUser(username: string): Promise<Survey[]> {
        this.log('LimeSurveyClient.getSurveysFromUser -> Started');
        
        await this.ensureAuthenticated();
        const result = await this.request<Survey[]>('list_surveys', [this.sessionKey, username]);
        
        this.log('LimeSurveyClient.getSurveysFromUser -> Completed');
        if (result instanceof Array === false) {
            throw new NotFoundError(`No surveys found for user ${username}`);
        } else {
            return result.map((survey) => this.normalizeSurveyDates(survey));
        }
    }
    
    /**
     * Get survey languages
     */
    async getSurveyLanguages(surveyId: number | string): Promise<SurveyLanguages> {
        this.log('LimeSurveyClient.getSurveyLanguages -> Started');
        
        await this.ensureAuthenticated();
        const result = await this.request<any>('get_survey_properties', [this.sessionKey, surveyId]);
        
        if (!result) {
            throw { message: 'Languages not found in Limesurvey' };
        }
        
        const languages: SurveyLanguages = {
            default: result.language,
            list: [result.language]
        };
        
        if (result.additional_languages) {
            const additional = result.additional_languages.split(' ').filter(Boolean);
            languages.list.push(...additional);
        }
        
        this.log('LimeSurveyClient.getSurveyLanguages -> Completed');
        return languages;
    }

    // ========================================================================
    // Survey Activation Management
    // ========================================================================
    /**
     * Activate a survey
     */
    async activateSurvey(surveyId: number | string): Promise<void> {
        this.log(`LimeSurveyClient.activateSurvey -> Starting survey: ${surveyId}`);
        
        await this.ensureAuthenticated();
        await this.request('activate_survey', [this.sessionKey, surveyId]);
        
        this.log(`LimeSurveyClient.activateSurvey -> Survey started: ${surveyId}`);
    }
    
    toLimeDate(date : Date): string {
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }
    async setActiveSurvey(surveyId: number | string, activate: boolean): Promise<void> {
        let expires = null;
        if (activate) {
            this.log(`LimeSurveyClient.setActiveSurvey -> Activating survey: ${surveyId}`);
        } else {
            expires = this.toLimeDate(new Date(Date.now()));
            this.log(`LimeSurveyClient.setActiveSurvey -> Deactivating survey: ${surveyId} - expires at ${expires}`);
        }
        await this.ensureAuthenticated();
        await this.request('set_survey_properties', [
            this.sessionKey,
            surveyId,
            { expires: expires }
        ]);
        this.log(`LimeSurveyClient.setActiveSurvey -> Survey updated: ${surveyId}`);
    }

    /**
     * Activate tokens for a survey
     */
    async activateTokens(surveyId: number | string): Promise<void> {
        this.log(`LimeSurveyClient.activateTokens -> Activating tokens for: ${surveyId}`);
        
        await this.ensureAuthenticated();
        await this.request('activate_tokens', [this.sessionKey, surveyId]);
        
        this.log(`LimeSurveyClient.activateTokens -> Completed: ${surveyId}`);
    }

    /**
     * Update survey settings for activated survey
     */
    private async updateActivatedSurveySettings(surveyId: number | string): Promise<void> {
        this.log('LimeSurveyClient.updateActivatedSurveySettings -> Started');
        
        await this.request('set_survey_properties', [
            this.sessionKey,
            surveyId,
            {
                anonymized: 'N',
                datestamp: 'Y',
                savetimings: 'Y',
                ipaddr: 'N',
                refurl: 'N'
            }
        ]);
        
        this.log('LimeSurveyClient.updateActivatedSurveySettings -> Completed');
    }

    async setSurveyActive(surveyId: number | string, active: boolean = true): Promise<void> {
        this.log(`LimeSurveyClient.setSurveyActive -> Starting survey: ${surveyId}`);
        await this.ensureAuthenticated();
        await this.request('set_survey_properties', [
            this.sessionKey,
            surveyId,
            { active: active ? 'Y' : 'N' }
        ]);
        this.log(`LimeSurveyClient.setSurveyActive -> Survey updated: ${surveyId}`);
    }

    /**
     * Set LRS endpoint for activity tracking
     */
    async setActivityLRSEndpoint(surveyId: number | string, lrsEndpoint: string): Promise<any> {
        this.log('LimeSurveyClient.setActivityLRSEndpoint -> Started');
        
        await this.ensureAuthenticated();
        const result = await this.request('update_plugin_settings', [
            this.sessionKey,
            'LimeSurveyXAPITracker',
            surveyId,
            { 'lrs-endpoint': lrsEndpoint }
        ]);
        
        this.log('LimeSurveyClient.setActivityLRSEndpoint -> Completed');
        return result;
    }

    async activateSurveyAndTokens(surveyId: number | string, lrsEndpoint: string): Promise<void> {
        this.log(`LimeSurveyClient.activateSurveyAndTokens -> Starting activation for survey: ${surveyId}`);
        // Configure survey settings
        await this.updateActivatedSurveySettings(surveyId);
        
        // Activate survey
        await this.activateSurvey(surveyId);
        
        // Activate tokens
        await this.activateTokens(surveyId);

        // Set LRS endpoint for activity tracking
        await this.setActivityLRSEndpoint(surveyId, lrsEndpoint);
        this.log(`LimeSurveyClient.activateSurveyAndTokens -> Survey activated: ${surveyId}`);
    }

    // ========================================================================
    // Participant Management
    // ========================================================================
    /**
     * List participants of a survey
     */
    async listParticipants(surveyId: number | string): Promise<any[]> {
        this.log('LimeSurveyClient.listParticipants -> Started');
        
        await this.ensureAuthenticated();
        const result = await this.request('list_participants', [this.sessionKey, surveyId]);
        
        this.log('LimeSurveyClient.listParticipants -> Completed');
        return result || [];
    }

    /**
     * Check if survey has a specific token
     */
    async hasToken(surveyId: number | string, token: string): Promise<boolean> {
        this.log('LimeSurveyClient.hasToken -> Started');
        
        await this.ensureAuthenticated();
        const participants = await this.request<any[]>('list_participants', [
            this.sessionKey,
            surveyId,
            0,
            100000
        ]);
        
        const found = participants.some(p => p.token === token);
        
        this.log(`LimeSurveyClient.hasToken -> ${found ? 'Found' : 'Not found'}`);
        return found;
    }

    /**
     * Add participants to a survey
     */
    async addParticipants(surveyId: number | string, participantTokens: string[]): Promise<any[]> {
        this.log('LimeSurveyClient.addParticipants -> Started');
        
        await this.ensureAuthenticated();
        
        const tokens: Participant[] = participantTokens.map(token => ({
            email: `${token}@dummy.dum`,
            firstname: token,
            lastname: 'dummy',
            token: token
        }));
        
        const result = await this.request('add_participants', [
            this.sessionKey,
            surveyId,
            tokens,
            false
        ]);
        
        this.log(`LimeSurveyClient.addParticipants -> Completed: ${surveyId}`);
        return result;
    }

    /**
     * Delete participants from a survey
     */
    async deleteParticipants(surveyId: number | string, participantTokens: string[]): Promise<any> {
        this.log(`LimeSurveyClient.deleteParticipants -> Started: ${surveyId}`);
        
        await this.ensureAuthenticated();
        const result = await this.request('delete_participants', [
            this.sessionKey,
            surveyId,
            participantTokens
        ]);
        
        this.log(`LimeSurveyClient.deleteParticipants -> Completed: ${surveyId}`);
        return result;
    }

    // ========================================================================
    // Survey Ownership Management
    // ========================================================================
    /**
     * Check if user owns a specific survey
     */
    async isUserOwnerOfSurvey(surveyId: number | string, username: string): Promise<OwnershipResult> {
        this.log('LimeSurveyClient.isUserOwnerOfSurvey -> Started');
        
        const surveys = await this.getSurveysFromUser(username);
        const isOwner = surveys.some(s => s.sid == surveyId);
        
        this.log('LimeSurveyClient.isUserOwnerOfSurvey -> Completed');
        return { isOwner };
    }

    /**
     * Set survey owner
     */
    async setSurveyOwner(surveyId: number, userId: number): Promise<any> {
        this.log('LimeSurveyClient.setSurveyOwner -> Started');
        
        await this.ensureAuthenticated();
        const result = await this.request('set_survey_properties', [
            this.sessionKey,
            surveyId,
            { owner_id: userId }
        ]);
        
        this.log('LimeSurveyClient.setSurveyOwner -> Completed');
        return result;
    }

    // ========================================================================
    // Response Management
    // ========================================================================

    /**
     * Get response IDs for a token
     */
    async getResponseIds(surveyId: number | string, token: string): Promise<number[]> {
        this.log('LimeSurveyClient.getResponseIds -> Started');
        
        await this.ensureAuthenticated();
        
        try {
            const result = await this.request<number[]>('get_response_ids', [
                this.sessionKey,
                surveyId,
                token
            ]);
            
            this.log('LimeSurveyClient.getResponseIds -> Completed');
            return result || [];
        } catch {
            throw { message: 'LimeSurvey table not initialized' };
        }
    }

    /**
     * Get responses for a survey
     */
    async getResponses(
        surveyId: number | string,
        language: string,
        participantTokens?: string[],
        type: 'code' | 'full' = 'code'
    ): Promise<Record<string, any>> {
        this.log('LimeSurveyClient.getResponses -> Started');
        
        await this.ensureAuthenticated();
        
        const headingType = type === 'full' ? 'full' : 'code';
        const responseType = type === 'full' ? 'long' : 'short';
        
        if (type === 'full' && participantTokens && participantTokens.length > 0) {
            // Fetch responses by token individually for full type
            return await this.getResponsesByTokens(surveyId, language, participantTokens, headingType, responseType);
        }
        
        // Export all responses
        const result = await this.request<string>('export_responses', [
            this.sessionKey,
            surveyId,
            'json',
            null,
            'all',
            headingType,
            responseType
        ]);
        
        if (!result || result.length === 0) {
            return {};
        }
        
        const decoded = this.decodeBase64Response(result);
        const responses = this.processResponses(decoded.responses, participantTokens);
        
        this.log('LimeSurveyClient.getResponses -> Completed');
        return responses;
    }

    private async getResponsesByTokens(
        surveyId: number | string,
        language: string,
        tokens: string[],
        headingType: string,
        responseType: string
    ): Promise<Record<string, any>> {
        const responses: Record<string, any> = {};
        
        await Promise.all(tokens.map(async (token) => {
            try {
                const result = await this.request<string>('export_responses_by_token', [
                    this.sessionKey,
                    surveyId,
                    'json',
                    token,
                    language,
                    'all',
                    headingType,
                    responseType
                ]);
                
                if (result && result.length > 0) {
                    const decoded = this.decodeBase64Response(result);
                    if (this.useNewVersion) {
                        for (const res of Object.values(decoded.responses)) {
                            responses[token] = res;
                        }
                    } else {
                        for (const rid of Object.values(decoded.responses)) {
                            for (const res of Object.values(rid as object)) {
                                responses[token] = res;
                            }
                        }
                    }
                } else {
                    responses[token] = null;
                }
            } catch {
                responses[token] = null;
            }
        }));
        
        return responses;
    }

    private processResponses(raw: any, filterTokens?: string[]): Record<string, any> {
        const responses: Record<string, any> = {};
        
        if (!raw) return responses;
        
        if (this.useNewVersion) {
            for (const res of Array.isArray(raw) ? raw : Object.values(raw)) {
                const token = (res as any).token;
                if (filterTokens && !filterTokens.includes(token)) continue;
                if (!responses[token] || !responses[token].submitdate) {
                    responses[token] = res;
                }
            }
        } else {
            for (const rid of Object.values(raw)) {
                for (const res of Object.values(rid as object)) {
                    const entry = res as any;
                    const token = entry.token;
                    if (filterTokens && !filterTokens.includes(token)) continue;
                    if (!responses[token] || !responses[token].submitdate) {
                        responses[token] = entry;
                    }
                }
            }
        }
        
        return responses;
    }

    /**
     * Get response by token
     */
    async getResponseByToken(
        surveyId: number | string,
        language: string,
        token: string,
        type: 'code' | 'full' = 'code'
    ): Promise<any> {
        this.log('LimeSurveyClient.getResponseByToken -> Started');
        
        await this.ensureAuthenticated();
        
        const headingType = type === 'full' ? 'full' : 'code';
        const responseType = type === 'full' ? 'long' : 'short';
        
        const result = await this.request('export_responses_by_token', [
            this.sessionKey,
            surveyId,
            'json',
            token,
            language,
            'all',
            headingType,
            responseType
        ]);
        
        if (!result) {
            return false;
        }
        
        let response: any;
        
        if (typeof result === 'object') {
            response = result;
        } else {
            try {
                response = this.decodeBase64Response(result);
            } catch {
                try {
                    response = JSON.parse(result);
                } catch {
                    throw { message: 'Error transforming LimeSurvey result' };
                }
            }
        }
        
        this.log('LimeSurveyClient.getResponseByToken -> Response received');
        
        if (response.status) {
            return false;
        }
        
        if (!response.responses || response.responses.length === 0) {
            return this.useNewVersion ? response : false;
        }
        
        // Find submitted response or return first
        if (this.useNewVersion) {
            for (const res of response.responses) {
                if (res.submitdate !== null) {
                    return res;
                }
            }
            return response.responses[0];
        } else {
            for (const item of response.responses) {
                const keys = Object.keys(item);
                if (item[keys[0]].submitdate !== null) {
                    return item[keys[0]];
                }
            }
            const lastItem = response.responses[response.responses.length - 1];
            const keys = Object.keys(lastItem);
            return lastItem[keys[0]];
        }
    }

    /**
     * Check if token has completed survey
     */
    async tokenHasCompleted(surveyId: number | string, token: string): Promise<boolean> {
        this.log('LimeSurveyClient.tokenHasCompleted -> Started');
        
        await this.ensureAuthenticated();
        
        const result = await this.request<string>('export_responses_by_token', [
            this.sessionKey,
            surveyId,
            'json',
            token
        ]);
        
        if (!result) {
            return false;
        }
        
        const decoded = this.decodeBase64Response(result);
        const responses = decoded.responses;
        
        if (!responses || responses.length === 0) {
            return false;
        }
        
        // Check for any completed response
        for (let i = 0; i < responses.length; i++) {
            const keys = Object.keys(responses[i]);
            if (responses[i][keys[0]]?.submitdate) {
                this.log('LimeSurveyClient.tokenHasCompleted -> Completed: true');
                return true;
            }
        }
        
        this.log('LimeSurveyClient.tokenHasCompleted -> Completed: false');
        return false;
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================
// Create default singleton instance
const limeSurveyClient = new LimeSurveyClient(config.limesurvey);

// Export the client class and default instance
export { limeSurveyClient };
export default LimeSurveyClient;