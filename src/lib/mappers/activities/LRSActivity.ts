import { config } from "@/lib/config";
import { Activity } from "@/lib/mappers/activities/Activity";

export class LRSActivity extends Activity {
	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params:any){
		super(params);
	}

	static getType(){
		return 'lrsactivity';
	}

	static getName(){
		return 'Minio-Kafka Activity';
	}

	static getDescription(){
		return 'A xAPI processor activity that sends the traces to kafka for later to be saved in minio.';
	}

	static async getUtils(username: string) : Promise<any> {
		return {};
	}

    
}