import { Activity } from "@/lib/mappers/activities/Activity";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { limeSurveyClient } from "@/lib/utils/limesurveyclient";
import { ActivityCompletion } from "@/lib/mappers/ActivityCompletion/ActivityCompletion";
import { ActivityMappingResult } from "../ActivityCompletion/ActivityMappingResult";
import { User } from "../Users/User";

/**
 * LimeSurvey Activity mapper class extending base Activity.
 * Represents activities that integrate with LimeSurvey platform for surveys and questionnaires.
 * 
 * @class LimesurveyActivity
 * @extends Activity
 * @description Handles LimeSurvey-specific properties and provides survey management functionality.
 * Integrates with LimeSurvey API for survey deployment and data collection.
 */
export class LimesurveyActivity extends Activity {
	/**
	 * ID of the survey in LimeSurvey system
	 * @default -1
	 */
	survey_id: number=-1;
	
	/**
	 * Language code for the survey (e.g., 'en', 'es')
	 * @default ''
	 */
	suvey_language: string='';
	
	/**
	 * Learning Record Store (LRS) set identifier for xAPI data
	 * @default -1
	 */
	survey_lrsset: number=-1;
	
	/**
	 * Creates a new LimesurveyActivity instance
	 * 
	 * @param {any} data - Raw data object containing activity and LimeSurvey-specific properties
	 * @description Initializes base activity properties and LimeSurvey-specific fields.
	 * Uses nullish coalescing for safe default value assignment.
	 */
	constructor(allocated:boolean, data: any) {
		super(allocated, data);
		// Assign limesurvey-specific properties if provided in data
		this.survey_id = data.survey_id ?? -1;
		this.suvey_language = data.suvey_language ?? '';
		this.survey_lrsset = data.survey_lrsset ?? -1;
	}
	
	/**
	 * Creates a LimesurveyActivity instance with database-loaded data
	 * 
	 * @static
	 * @async
	 * @param {any} activityData - Raw activity data object
	 * @returns {Promise<LimesurveyActivity>} Fully initialized LimesurveyActivity instance
	 * @description Factory method that creates instance and loads additional data from database.
	 * Handles database errors gracefully and ensures proper initialization.
	 */
	static async getFromDbData(activity_id: number, user_id: number, allocated:boolean, activityData: any): Promise<LimesurveyActivity> {
		const instance = new LimesurveyActivity(allocated, activityData);
		
		const limesurveyData = await db.Tables.LimesurveyActivities.findOne({ 
			where: { activity_id: activity_id } 
		});
		
		if (limesurveyData) {
			instance.survey_id = limesurveyData.survey_id ?? -1;
			instance.suvey_language = limesurveyData.suvey_language ?? '';
			instance.survey_lrsset = limesurveyData.survey_lrsset ?? -1;
		}
		
		return instance;
	}
	
	static getType(){
		return 'limesurvey';
	}

	static getName(){
		return 'LimeSurvey Activity';
	}
	
	static getDescription() : string {
		return 'An activity integrated with LimeSurvey for surveys and questionnaires.';
	}

	static async getUtils(): Promise<object> {
		let utils = await super.getUtils() as any;
		let isOnline = await limeSurveyClient.isOnline();
		utils = { ...utils, url: config.limesurvey.url, isOnline };
		if(config.limesurvey.useNewVersion) {
			utils.editurl= config.limesurvey.external_url + "/surveyAdministration/view?surveyid=" ;
			utils.newurl= config.limesurvey.external_url + "/surveyAdministration/newSurvey" ;
		} else {
			utils.editurl= config.limesurvey.external_url + "/admin/survey/sa/view/surveyid/" ;
			utils.newurl= config.limesurvey.external_url + "/admin/survey/sa/newsurvey" ;
		}
		return utils;
	}

	/**
	 * Retrieves detailed information about this LimeSurvey activity.
	 * Currently returns empty object - placeholder for future implementation.
	 * 
	 * @async
	 * @method getDetails
	 * @returns {Promise<object>} Promise resolving to activity details object
	 * @override
	 */
	async getDetails(): Promise<object>{
		return {};
	}

	async activate(activate: boolean): Promise<void> {
		await super.activate(activate);
    }

	canBeOpened(): boolean {
		return true;
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
		const usernames = await this.getAllCurrentParticipantsUsername(participants_id);
		for (let i = 0; i < participants_id.length; i++) {
			targetMap.set(participants_id[i], `${config.limesurvey.external_url}/${this.survey_id}?token=${usernames.get(participants_id[i])}&lang=${this.suvey_language}`);
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
		return super.sendXAPITraceForActivity(username, verb, timestamp, resultScore, reasonExtension);
	}
	
	/**
	 * Converts the LimesurveyActivity instance to a JSON representation.
	 * Extends the base Activity JSON with LimeSurvey-specific properties.
	 * 
	 * @method toJSON
	 * @returns {object} JSON object containing base activity properties plus LimeSurvey fields
	 * @override
	 */
	toJSON(): object {
		return {
			...super.toJSON(),
			activity_type : LimesurveyActivity.getType(),
			survey_id: this.survey_id,
			suvey_language: this.suvey_language,
			survey_lrsset: this.survey_lrsset
		};
	}
}