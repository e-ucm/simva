import { Activity } from "@/services/activities/libs/Activity";

export class GamePlayActivity extends Activity {
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