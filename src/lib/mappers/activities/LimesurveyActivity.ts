import { Activity } from "@/lib/mappers/activities/Activity";
import { LRSActivity } from "@/lib/mappers/activities/LRSActivity";
import { db } from "@/lib/db";
import { config } from "@/lib/config";


export class LimesurveyActivity extends Activity {
	survey_id: number=-1;
	language: string='';
	lrsset: number=-1;
	
	constructor(data: any) {
		super(data);
		// Assign limesurvey-specific properties if provided in data
		this.survey_id = data.survey_id ?? -1;
		this.language = data.language ?? '';
		this.lrsset = data.lrsset ?? -1;
	}
	
	// Static factory method to create instance with database data
	static async createWithDbData(activityData: any): Promise<LimesurveyActivity> {
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
		return {
			surveys: [], // Fetch surveys related to this activity
			responses: [] // Fetch responses related to this activity
		};
	}
}