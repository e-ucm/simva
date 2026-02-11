import { Activity } from "@/lib/mappers/activities/Activity";
import { db } from "@/lib/db";

export class ManualActivity extends Activity {
	user_managed:boolean=false;
	ressource_type: string='';
	ressource_url: string='';

	constructor(data: any) {
		super(data);
		db.Tables.ManualActivities.findOne({ where: { activity_id: this.activity_id } }).then((activityData) => {
			if (activityData) {
				Object.assign(this, activityData);
			}
		});
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
		return {
			markComplete: async () => {
				// Logic to mark activity as complete
			},
			gradeActivity: async (grade: number) => {
				// Logic to grade the activity
			}
		};
	}

	async getDetails(){
		return {
			completionStatus: false, // Fetch completion status
			grade: null // Fetch grade if available
		};
	}
}