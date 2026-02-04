import { Activity } from "@/services/activities/libs/Activity";

export class ManualActivity extends Activity {
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