import { Activity } from "@/lib/mappers/activities/Activity";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { limeSurveyClient } from "@/lib/utils/limesurveyclient";
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
		
		try {
			const limesurveyData = await db.Tables.LimesurveyActivities.findOne({ 
				where: { activity_id: activity_id } 
			});
			
			if (limesurveyData) {
				instance.survey_id = limesurveyData.survey_id ?? -1;
				instance.suvey_language = limesurveyData.suvey_language ?? '';
				instance.survey_lrsset = limesurveyData.survey_lrsset ?? -1;
			}
		} catch (error) {
			console.error('Error loading LimesurveyActivity data:', error);
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

	static async getUtils(username : string) : Promise<any> {
		let utils = await super.getUtils(username) as any;
		let isOnline = await limeSurveyClient.isOnline();
		utils = { ...utils, url: config.limesurvey.url, isOnline };
		if(config.limesurvey.useNewVersion) {
			utils.editurl= config.limesurvey.url + "/surveyAdministration/view?surveyid=" ;
			utils.newurl= config.limesurvey.url + "/surveyAdministration/newSurvey" ;
		} else {
			utils.editurl= config.limesurvey.url + "/admin/survey/sa/view/surveyid/" ;
			utils.newurl= config.limesurvey.url + "/admin/survey/sa/newsurvey" ;
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