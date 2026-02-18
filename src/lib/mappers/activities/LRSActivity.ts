import { config } from "@/lib/config";
import { Activity } from "@/lib/mappers/activities/Activity";

/**
 * Learning Record Store (LRS) Activity mapper class extending base Activity.
 * Handles activities that integrate with LRS systems for xAPI data storage and processing.
 * 
 * @class LRSActivity
 * @extends Activity
 * @description Manages LRS integration including Minio storage and Kafka streaming
 * for learning analytics and experience data collection.
 */
export class LRSActivity extends Activity {
	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	/**
	 * Creates a new LRSActivity instance
	 * 
	 * @param {any} params - Raw data object containing activity and LRS-specific properties
	 * @description Initializes base activity properties for LRS integration.
	 */
	constructor(allocated : boolean, params:any){
		super(allocated, params);
	}

	/**
	 * Gets the activity type identifier
	 * 
	 * @static
	 * @returns {string} The LRS activity type string
	 * @description Returns the specific type identifier for LRS activities.
	 */
	static getType(){
		return 'lrsactivity';
	}

	/**
	 * Gets the human-readable name for this activity type
	 * 
	 * @static
	 * @returns {string} The LRS activity type name
	 * @description Returns a user-friendly name indicating Minio-Kafka integration.
	 */
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