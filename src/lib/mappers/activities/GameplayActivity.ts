import { Activity } from "@/lib/mappers/activities/Activity";
import {db } from "@/lib/db";

export class GamePlayActivity extends Activity {
	backup: boolean= false;
	scorm_xapi_by_game: boolean = false;
	category_id?: number;
	subject_area_id?: number;
	game_type?: string;
	game_url?: string;
	
	constructor(data: any) {
		super(data);
		db.Tables.GamePlayActivities.findOne({ where: { activity_id: this.activity_id } }).then((activityData) => {
			if (activityData) {
				Object.assign(this, activityData);
			}
		});
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

	static async getUtils(username : string){
		return {
			startGame: async (gameId: string) => {
				// Logic to start a game session
			},
			submitScore: async (gameId: string, score: number) => {
				// Logic to submit a score
			}
		};
	}

	async getDetails(){
		return {
			gameSessions: [], // Fetch game sessions related to this activity
			scores: [] // Fetch scores related to this activity
		};
	}
} 