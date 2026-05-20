import { Activity } from "@/lib/mappers/activities/Activity";
import {db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ActivityCompletion } from "@/lib/mappers/ActivityCompletion/ActivityCompletion";
import { config } from "@/lib/config";
import { ActivityMappingResult } from "../ActivityCompletion/ActivityMappingResult";
import { minioClient } from "@/lib/utils/minioclient";
import { BadRequestError, ValidationError } from "@/lib/errors/appErrors";
import ms from "ms";
import { User } from "@/lib/mappers/Users/User";

/**
 * Gameplay Activity mapper class extending base Activity.
 * Represents activities involving serious games and interactive gameplay sessions.
 * 
 * @class GamePlayActivity
 * @extends Activity
 * @description Handles game-specific properties including SCORM/xAPI integration,
 * categorization, and game session management for research purposes.
 */
export class GamePlayActivity extends Activity {
	/**
	 * Whether backup of game data is enabled
	 * @default false
	 */
	game_backup: boolean= false;
	
	/**
	 * Whether SCORM/xAPI data is handled by the game itself
	 * @default false
	 */
	game_scorm_xapi: boolean = false;
	
	/**
	 * Type/genre of the game (e.g., 'adventure', 'puzzle')
	 */
	game_type: string;
	
	/**
	 * URL where the game can be accessed
	 */
	game_url: string;
	
	/**
	 * Creates a new GamePlayActivity instance
	 * 
	 * @param {any} data - Raw data object containing activity and gameplay-specific properties
	 * @description Initializes base activity properties and gameplay-specific fields.
	 * Uses nullish coalescing for safe assignment of boolean properties.
	 */
	constructor(allocated:boolean, data: any) {
		super(allocated, data);
		// Assign gameplay activity-specific properties if provided in data
		this.game_backup = data.game_backup ?? false;
		this.game_scorm_xapi = data.game_scorm_xapi ?? false;
		this.game_type = data.game_type;
		this.game_url = data.game_url;
	}
	
	/**
	 * Creates a GamePlayActivity instance with database-loaded data
	 * 
	 * @static
	 * @async
	 * @param {any} activityData - Raw activity data object
	 * @returns {Promise<GamePlayActivity>} Fully initialized GamePlayActivity instance
	 * @description Factory method that creates instance and loads additional data from database.
	 * Handles database errors gracefully and ensures proper initialization.
	 */
	static async getFromDbData(activity_id: number, allocated: boolean, is_admin: boolean, activityData: any, user_id?: number): Promise<GamePlayActivity> {
		const instance = new GamePlayActivity(allocated, activityData);

		let gameplayData = await db.Tables.GamePlayActivities.findOne({ 
			where: { activity_id: activity_id } 
		});
		
		if (!gameplayData) {
			if(!activityData.game_url) {
				logger.warn(`Game URL is missing for activity ID ${activity_id}, setting default empty string.`);
				activityData.game_url = '';
			}
			gameplayData = await db.Tables.GamePlayActivities.create({
				activity_id: activity_id,
				game_backup: activityData.game_backup || false,
				game_scorm_xapi: activityData.game_scorm_xapi || false,
				game_type: activityData.game_type || "WEB",
				game_url: activityData.game_url
			});
		}
		instance.game_backup = gameplayData.game_backup ?? false;
		instance.game_scorm_xapi = gameplayData.game_scorm_xapi ?? false;
		instance.game_type = gameplayData.game_type;
		instance.game_url = gameplayData.game_url;
		
		return instance;
	}
	
	static getType(){
		return 'gameplay';
	}
	
	static getName(){
		return 'GamePlay Activity';
	}

	static getDescription(){
		return 'An activity to track gameplay sessions and scores.';
	}

	static async getUtils(): Promise<object> {
		return super.getUtils();
	}

	async activate(activate: boolean): Promise<void> {
		await super.activate(activate);
    }

	async addParticipants(participants_id: number[]): Promise<ActivityCompletion[]> {
		return super.addParticipants(participants_id);
	}

	async removeParticipants(participants_id: number[]): Promise<void> {
		super.removeParticipants(participants_id);
	}	

	canBeOpened(): boolean {
		return this.game_url !== undefined && this.game_url !== '';
	}

	async getAllCurrentParticipantsId(participants_id?: number[]): Promise<number[]> {
		return super.getAllCurrentParticipantsId(participants_id);
	}
	async getAllCurrentParticipantsUsername(participants_id?: number[]): Promise<Map<number, string>> {
		return super.getAllCurrentParticipantsUsername(participants_id);
	}
	async target(participants_id?: number[]): Promise<ActivityMappingResult<string>> {
		participants_id = await this.getAllCurrentParticipantsId(participants_id);
		let targetMap = new Map<number, string>();
		let usernames=await this.getAllCurrentParticipantsUsername(participants_id);
		for (const participant_id of participants_id) {
			let customUri;
			switch(this.game_type) {
				case "WEB":
					logger.info(this.game_url);
					const user = await User.getFromDbData(participant_id);
					if(this.game_url && this.game_url.indexOf('?') !== -1){
						customUri = this.game_url;
						customUri = customUri.replace('{simvaResultBackupUri}', encodeURIComponent(`${config.api.url}/activities/${this.activity_id}/result`)); //OK
						customUri = customUri.replace('{simvaResultUri}', encodeURIComponent(`${config.api.url}/activities/${this.activity_id}/lrs`)); //OK
						customUri = customUri.replace('{simvaHomePage}', encodeURIComponent(`${config.external_url}`)); //OK
						customUri = customUri.replace('{activityId}', this.activity_id.toString()); //OK
						customUri = customUri.replace('{studyId}', this.simlet_id.toString()); //OK
						if(user.isToken) {
							customUri = customUri.replace('{tokenEndpoint}', encodeURIComponent(`${config.sso.tokenUrl}`)); //OK
							customUri = customUri.replace('{userToken}', user.token!); //OK
							customUri = customUri.replace('{username}', user.token!); //OK
						} else {
							customUri = customUri.replace('{userToken}', user.username); //OK
							customUri = customUri.replace('{username}', user.username); //OK
						}
						if(this.game_url.indexOf('{authToken}') !== -1 || this.game_url.indexOf('{auth_token}') !== -1){
							let authToken = await user.generateJWT();
							// Replace both {authToken} and {auth_token} if present
							customUri = customUri.replace('{authToken}', encodeURIComponent(`Bearer ${authToken}`));
							customUri = customUri.replace('{auth_token}', encodeURIComponent(`Bearer ${authToken}`));
						}
					} else {
						customUri = `${this.game_url}?result_uri=${encodeURIComponent(`${config.api.url}/activities/${this.activity_id}/lrs`)}`
							+ `&backup_uri=${encodeURIComponent(`${config.api.url}/activities/${this.activity_id}/result`)}`
							+ `&backup_type=XAPI`
							+ `&platform=${encodeURIComponent(`${config.externalUrl}`)}`
							+ `&actor_homepage=${encodeURIComponent(`${config.externalUrl}`)}`
							+ `&batch_length=200`
							+ `&batch_timeout=5min`
							+ `&max_retry_delay=30min`;
						if(user.isToken) {
							customUri += `&sso_token_endpoint=${encodeURIComponent(`${config.sso.tokenUrl}`)}`
							+ `&sso_client_id=simva-plugin`
							+ `&sso_login_hint=${this.simlet_id}`
							+ `&sso_username=${user.token}`
							+ `&actor_user=${user.token}`
							+ `&sso_grant_type=password`
							+ `&sso_scope=offline_access`
						} else {
							let authToken = await user.generateJWT();
							customUri += `&auth_token=${encodeURIComponent(`Bearer ${authToken}`)}`
									+ `&actor_user=${user.username}`;
						}
					}
					targetMap.set(participant_id, customUri);
				default:
					break;
			}
			
		}
		logger.debug(targetMap.toString());
		return new ActivityMappingResult(targetMap);
	}

	async getInitialized(participants_id?: number[]): Promise<ActivityMappingResult<boolean | null>> {
		return super.getInitialized(participants_id);
	}

	async setInitialized(initialized: boolean, initialized_date: Date, participant_id: number): Promise<ActivityCompletion> {
		return super.setInitialized(initialized, initialized_date, participant_id);
	}

	async getProgress(participants_id?: number[]): Promise<ActivityMappingResult<number | null>> {
		return super.getProgress(participants_id);
	}
	
	async setProgress(progress: number, progress_date: Date, participant_id: number): Promise<ActivityCompletion> {
		return super.setProgress(progress, progress_date, participant_id);
	}

	async getCompletion(participants_id?: number[]): Promise<ActivityMappingResult<boolean | null>> {
		return super.getCompletion(participants_id);
	}

	async setCompletion(completed: boolean, completed_date: Date, participant_id: number): Promise<ActivityCompletion> {
		return super.setCompletion(completed, completed_date, participant_id);
	}

	async setMultiCompletion(status : boolean): Promise<ActivityCompletion[]> {
		return super.setMultiCompletion(status);
	}

	async setSuspension(status : boolean, participant_id: number, reason?: string): Promise<ActivityCompletion> {
		return super.setSuspension(status, participant_id, reason);
	}

	async getSuspension(participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
		return super.getSuspension(participants_id);
	}

	async hasResults(type: string, participants_id?: number[]): Promise<ActivityMappingResult<boolean>>{
		return super.hasResults(type, participants_id);
	}

	async getResults(type: string, participants_id?: number[]): Promise<ActivityMappingResult<string | null>> {
		return super.getResults(type, participants_id);
	}

	async setResult(type: string, result: any, participant_id: number): Promise<void> {
		switch(type) {
			case 'full':
			case 'code':
				if(!this.game_backup) {
					throw new ValidationError('Game backup is not enabled for this activity');
				}
				break;
			case 'traces':
				break;
			default:
				throw new BadRequestError(`Unsupported result type: ${type}`);
		}
		await super.setResult(type, result, participant_id);
	}

	async generatePresignedFileUrl(): Promise<string> {
		return super.generatePresignedFileUrl();
	}

	/**
	 * Patches the gameplay activity with provided data.
	 * Updates both base activity fields and gameplay-specific fields.
	 * 
	 * @async
	 * @method patch
	 * @param {any} data - Data object containing fields to update
	 * @returns {Promise<void>}
	 */
	async patch(data: any): Promise<void> {
		// First, update base activity fields
		await super.patch(data);
		
		// Now update gameplay-specific fields
		const gameplayData: any = {};
		if (data.game_backup !== undefined) {
			gameplayData.game_backup = data.game_backup;
		}
		if (data.game_scorm_xapi !== undefined) {
			gameplayData.game_scorm_xapi = data.game_scorm_xapi;
		}
		if (data.game_url !== undefined) {
			gameplayData.game_url = data.game_url;
		}
		if (data.game_uri !== undefined) {
			gameplayData.game_url = data.game_uri;
		}
		if (data.game_type !== undefined) {
			gameplayData.game_type = data.game_type;
		}
		
		if (Object.keys(gameplayData).length > 0) {
			const gameplayActivity = await db.Tables.GamePlayActivities.findOne({ 
				where: { activity_id: this.activity_id } 
			});
			if (gameplayActivity) {
				await gameplayActivity.update(gameplayData);
			}
		}
	}

	async sendXAPITraceForActivity(verb: "initialized" | "resumed" | "suspended" | "terminated", completionData: ActivityCompletion, timestamp ?: Date, reasonExtension ?: string, resultScore ?: number, resultSuccess ?: boolean): Promise<void> {
		if(!this.game_scorm_xapi){
			return super.sendXAPITraceForActivity(verb, completionData, timestamp, reasonExtension, resultScore, resultSuccess);
		}
	}

	async remove(): Promise<void> {
		const gameplayActivity = await db.Tables.GamePlayActivities.findOne({
			where: { activity_id: this.activity_id }
		});
		if(gameplayActivity){
			await gameplayActivity.destroy();
		}
		await super.remove();
	}

	/**
	 * Converts the GamePlayActivity instance to a JSON representation.
	 * Extends the base Activity JSON with gameplay-specific properties.
	 * 
	 * @method toJSON
	 * @returns {object} JSON object containing base activity properties plus game fields
	 * @override
	 */
	toJSON(): object {
		return {
			...super.toJSON(),
			activity_type : GamePlayActivity.getType(),
			game_backup: this.game_backup,
			game_scorm_xapi: this.game_scorm_xapi,
			game_type: this.game_type,
			game_url: this.game_url
		};
	}
	
	async export(complete: boolean): Promise<object> {
		let exportData: any = this.toJSON();
		if(complete) {
			exportData.participants = await this.getAllCurrentParticipantsUsername();
			exportData.results = await this.getResults("full");
		}
		return exportData;
	}
} 