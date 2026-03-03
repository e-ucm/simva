import { Activity } from "@/lib/mappers/activities/Activity";
import {db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ActivityCompletion } from "@/lib/mappers/ActivityCompletion/ActivityCompletion";
import { config } from "@/lib/config";
import { ActivityMappingResult } from "../ActivityCompletion/ActivityMappingResult";
import { minioClient } from "@/lib/utils/minioclient";
import { BadRequestError, ValidationError } from "@/lib/errors/appErrors";
import ms from "ms";

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
	static async getFromDbData(activity_id: number, user_id: number, allocated:boolean, activityData: any): Promise<GamePlayActivity> {
		const instance = new GamePlayActivity(allocated, activityData);
				
		const gameplayData = await db.Tables.GamePlayActivities.findOne({ 
			where: { activity_id: activity_id } 
		});
		
		if (gameplayData) {
			instance.game_backup = gameplayData.game_backup ?? false;
			instance.game_scorm_xapi = gameplayData.game_scorm_xapi ?? false;
			instance.game_type = gameplayData.game_type;
			instance.game_url = gameplayData.game_url;
		}
		
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
					if(this.game_url && this.game_url.indexOf('?') !== -1){
						if(this.game_url.indexOf('{authToken}') !== -1){
							//let authToken = await UsersController.generateJWT(users[participants[i]]);
							//customUri = customUri.replace('{authToken}', authToken);
						}
						customUri = this.game_url;
						customUri = customUri.replace('{simvaResultBackupUri}', encodeURIComponent(`${config.api.url}/activities/${this.activity_id}/backup`)); //OK
						customUri = customUri.replace('{simvaResultUri}', encodeURIComponent(`${config.api.url}/activities/${this.activity_id}`)); //OK
						customUri = customUri.replace('{simvaHomePage}', encodeURIComponent(`${config.external_url}`)); //OK
						customUri = customUri.replace('{tokenEndpoint}', encodeURIComponent(`${config.sso.tokenUrl}`)); //OK
						customUri = customUri.replace('{userToken}', participant_id.toString()); //OK
						customUri = customUri.replace('{activityId}', this.activity_id.toString()); //OK
						customUri = customUri.replace('{studyId}', this.simlet_id.toString()); //OK
						customUri = customUri.replace('{username}', participant_id.toString()); //OK
					} else {
						customUri = `${this.game_url}?result_uri=${encodeURIComponent(`${config.api.url}/activities/${this.activity_id}`)}`
							+ `&backup_uri=${encodeURIComponent(`${config.api.url}/activities/${this.activity_id}/result`)}`
							+ `&backup_type=XAPI`
							+ `&actor_homepage=${encodeURIComponent(`${config.externalUrl}`)}`
							+ `&actor_user=${usernames.get(participant_id)}`
							+ `&sso_token_endpoint=${encodeURIComponent(`${config.sso.tokenUrl}`)}`
							+ `&sso_client_id=simva-plugin`
							+ `&sso_login_hint=${this.simlet_id}`
							+ `&sso_username=${usernames.get(participant_id)}`
							+ `&sso_grant_type=password`
							+ `&sso_scope=offline_access`
							+ `&batch_length=200`
							+ `&batch_timeout=5min`
							+ `&max_retry_delay=30min`;
					}
					targetMap.set(participant_id, customUri);
				default:
					break;
			}
			
		}
		logger.debug(targetMap.toString());
		return new ActivityMappingResult(targetMap);
	}

	async getInitialized(participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
		return super.getInitialized(participants_id);
	}

	async setInitialized(initialized: boolean, participant_id: number): Promise<ActivityCompletion> {
		return super.setInitialized(initialized, participant_id);
	}

	async getProgress(participants_id?: number[]): Promise<ActivityMappingResult<number>> {
		return super.getProgress(participants_id);
	}
	
	async setProgress(progress: number, participant_id: number): Promise<ActivityCompletion> {
		return super.setProgress(progress, participant_id);
	}

	async getCompletion(participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
		return super.getCompletion(participants_id);
	}

	async setCompletion(completed: boolean, participant_id: number): Promise<ActivityCompletion> {
		return super.setCompletion(completed, participant_id);
	}

	async setMultiCompletion(status : boolean): Promise<ActivityCompletion[]> {
		return super.setMultiCompletion(status);
	}

	async setSuspension(status : boolean, participant_id: number): Promise<ActivityCompletion> {
		return super.setSuspension(status, participant_id);
	}

	async getSuspension(participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
		return super.getSuspension(participants_id);
	}

	async hasResults(type: string, participants_id?: number[]): Promise<ActivityMappingResult<boolean>>{
		let resultMap = new Map<number, boolean>();
		switch(type) {
			case 'results':
				for (const participant_id of await this.getAllCurrentParticipantsId(participants_id)) {
					if(await minioClient.fileExists(`${config.minio.backupDir}/${this.activity_id}/${participant_id}.result`)) {
						resultMap.set(participant_id, true);
					} else {
						resultMap.set(participant_id, false);
					}
				}
				break;
			default:
				break;
		}
		return new ActivityMappingResult(resultMap);
	}

	async getResults(type: string, participants_id?: number[]): Promise<ActivityMappingResult<string | null>> {
		let resultMap = new Map<number, string | null>();
		let participantIds: number[] = await this.getAllCurrentParticipantsId(participants_id);
		logger.debug(`Getting results for activity ${this.activity_id} and participants ${participantIds}`);
		for (const participant_id of participantIds) {
			switch(type) {
				case 'results':
					let file=`${config.minio.backupDir}/${this.activity_id}/${participant_id}.result`;
					logger.debug(`Checking if file exists: ${file}`);
					if(await minioClient.fileExists(file)) {
						resultMap.set(participant_id, await minioClient.getPresignedUrl(file, config.minio.presignedUrlExpirationSeconds));
					} else {
						resultMap.set(participant_id, null);
					}
					break;
				default:
					resultMap.set(participant_id, null);
					break;
			}
		}
		return new ActivityMappingResult(resultMap);
	}

	async setResult(type: string, result: any, participant_id: number): Promise<void> {
		switch(type) {
			case 'results':
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

	async sendXAPITraceForActivity(username: string, verb: string, timestamp : string, resultScore : number, reasonExtension : string): Promise<void> {
		if(!this.game_scorm_xapi){
			return super.sendXAPITraceForActivity(username, verb, timestamp, resultScore, reasonExtension);
		}
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
} 