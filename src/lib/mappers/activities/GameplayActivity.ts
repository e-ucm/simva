import { Activity } from "@/lib/mappers/activities/Activity";
import {db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ActivityCompletion } from "@/lib/mappers/ActivityCompletion/ActivityCompletion";
import { config } from "@/lib/config";
import { ActivityMappingResult } from "../ActivityCompletion/ActivityMappingResult";

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
	 * Category ID for game classification
	 */
	category_id: number;
	
	/**
	 * Subject area ID for educational context
	 */
	subject_area_id: number;
	
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
		this.category_id = data.category_id;
		this.subject_area_id = data.subject_area_id;
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
			instance.category_id = gameplayData.category_id as number;
			instance.subject_area_id = gameplayData.subject_area_id as number;
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

	static async getUtils(username : string) : Promise<any> {
		return super.getUtils(username);
	}

	/**
	 * Retrieves detailed information about this gameplay activity.
	 * Currently returns placeholder data structure for game sessions and scores.
	 * 
	 * @async
	 * @method getDetails
	 * @returns {Promise<object>} Promise resolving to object with gameSessions and scores arrays
	 * @override
	 */
	async getDetails(): Promise<object>{
		return {
			gameSessions: [], // Fetch game sessions related to this activity
			scores: [] // Fetch scores related to this activity
		};
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

	async setInitialized(initialized: boolean, participants_id?: number[]): Promise<ActivityCompletion[]> {
		return super.setInitialized(initialized, participants_id);
	}

	async getProgress(participants_id?: number[]): Promise<ActivityMappingResult<number>> {
		return super.getProgress(participants_id);
	}
	
	async setProgress(progress: number, participants_id?: number[]): Promise<ActivityCompletion[]> {
		return super.setProgress(progress, participants_id);
	}

	async getCompletion(participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
		return super.getCompletion(participants_id);
	}

	async setCompletion(completed: boolean, participants_id?: number[]): Promise<ActivityCompletion[]> {
		return super.setCompletion(completed, participants_id);
	}

	async setMultiCompletion(status : boolean): Promise<ActivityCompletion[]> {
		return super.setMultiCompletion(status);
	}

	async setSuspension(status : boolean, participants_id?: number[]): Promise<ActivityCompletion[]> {
		return super.setSuspension(status, participants_id);
	}

	async getSuspension(participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
		return super.getSuspension(participants_id);
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
			category_id: this.category_id,
			subject_area_id: this.subject_area_id,
			game_type: this.game_type,
			game_url: this.game_url
		};
	}
} 