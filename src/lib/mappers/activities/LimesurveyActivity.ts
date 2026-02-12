import { Activity } from "@/lib/mappers/activities/Activity";
import { LRSActivity } from "@/lib/mappers/activities/LRSActivity";
import { db } from "@/lib/db";
import { config } from "@/lib/config";

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
	language: string='';
	
	/**
	 * Learning Record Store (LRS) set identifier for xAPI data
	 * @default -1
	 */
	lrsset: number=-1;
	
	/**
	 * Creates a new LimesurveyActivity instance
	 * 
	 * @param {any} data - Raw data object containing activity and LimeSurvey-specific properties
	 * @description Initializes base activity properties and LimeSurvey-specific fields.
	 * Uses nullish coalescing for safe default value assignment.
	 */
	constructor(data: any) {
		super(data);
		// Assign limesurvey-specific properties if provided in data
		this.survey_id = data.survey_id ?? -1;
		this.language = data.language ?? '';
		this.lrsset = data.lrsset ?? -1;
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
	static async getFromDbData(activityData: any): Promise<LimesurveyActivity> {
		const instance = new LimesurveyActivity(activityData);
		
		try {
			const limesurveyData = await db.Tables.LimesurveyActivities.findOne({ 
				where: { activity_id: instance.activity_id } 
			});
			
			if (limesurveyData) {
				instance.survey_id = limesurveyData.survey_id ?? -1;
				instance.language = limesurveyData.language ?? '';
				instance.lrsset = limesurveyData.lrsset ?? -1;
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
		let utils = await LRSActivity.getUtils(username);
		utils = { ...utils, url: config.limesurvey.external_url };
		if(config.limesurvey.useNewVersion) {
			utils.editurl= config.limesurvey.external_url + "/surveyAdministration/view?surveyid=" ;
			utils.newurl= config.limesurvey.external_url + "/surveyAdministration/newSurvey" ;
		} else {
			utils.editurl= config.limesurvey.external_url + "/admin/survey/sa/view/surveyid/" ;
			utils.newurl= config.limesurvey.external_url + "/admin/survey/sa/newsurvey" ;
		}
		return utils;
	}

	async getDetails(){
		return {};
	}
}