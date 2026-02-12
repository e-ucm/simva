import { Activity } from "@/lib/mappers/activities/Activity";
import { LRSActivity } from "@/lib/mappers/activities/LRSActivity";
import { db } from "@/lib/db";


export class ManualActivity extends Activity {
	user_managed:boolean=false;
	ressource_type: string='';
	ressource_url: string='';

	constructor(data: any) {
		super(data);
		// Assign manual activity-specific properties if provided in data
		this.user_managed = data.user_managed ?? false;
		this.ressource_type = data.ressource_type ?? '';
		this.ressource_url = data.ressource_url ?? '';
	}
	
	// Static factory method to create instance with database data
	static async createWithDbData(activityData: any): Promise<ManualActivity> {
		const instance = new ManualActivity(activityData);
		
		try {
			const manualData = await db.Tables.ManualActivities.findOne({ 
				where: { activity_id: instance.activity_id } 
			});
			
			if (manualData) {
				instance.user_managed = manualData.user_managed ?? false;
				instance.ressource_type = manualData.ressource_type ?? '';
				instance.ressource_url = manualData.ressource_url ?? '';
			}
		} catch (error) {
			console.error('Error loading ManualActivity data:', error);
		}
		
		return instance;
	}
	
	static getType(){
		return 'manual';
	}

	static getName(){
		return 'Manual Activity';
	}
	
	static getDescription(){
		return 'An activity that requires manual completion and grading.';
	}

	static async getUtils(username : string){
		return LRSActivity.getUtils(username);
	}

	async getDetails(){
		return {
			completionStatus: false, // Fetch completion status
			grade: null // Fetch grade if available
		};
	}
}