import { db } from "@/lib/db";
import { ActivityToClass } from "@/lib/mappers/activities/ActivityToClass";
import { NotFoundError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * Base Activity mapper class representing an activity within a session.
 * Activities are the core units of interaction in studies (simlets).
 * 
 * @class Activity
 * @description Base class for all activity types with common properties and methods.
 * Can be extended by specific activity types like LimesurveyActivity, GameplayActivity, etc.
 */
export class Activity {
 	/**
 	 * The ID of the session this activity belongs to
 	 */
 	session_id: number;
	
	/**
	 * Unique identifier for this activity
	 */
	activity_id: number;
	
	/**
	 * Human-readable name for the activity
	 */
	name: string;
	
	/**
	 * Type of activity (e.g., 'limesurvey', 'gameplay', 'manual')
	 */
	activity_type: string;
	
	/**
	 * Timestamp when the activity was created
	 */
	createdAt: Date;
	
	/**
	 * Timestamp when the activity was last updated
	 */
	updatedAt: Date;
	
	/**
	 * Pre-signed URL for accessing activity resources (optional)
	 */
	presignedURL?: string;
	
	/**
	 * Timestamp when presigned URL was generated (optional)
	 */
	generated_at?: Date;
	
	/**
	 * Expiration time for presigned URL in seconds (optional)
	 */
	expires_on_seconds?: number;
	
	/**
	 * Whether trace data storage is enabled for this activity
	 */
	trace_storage: boolean;
	
	/**
	 * Optional description of the activity
	 */
	description?: string;

	/**
	 * Creates a new Activity instance
	 * 
	 * @param {any} data - Raw data object containing activity properties
	 * @description Initializes activity properties from provided data object.
	 * Sets default values for optional properties.
	 */
	constructor(data: any) {
		this.session_id = data.session_id;
		this.activity_id = data.activity_id;
		this.name = data.name;
		this.activity_type = data.activity_type;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
		this.presignedURL = data.presignedURL|| "";
		this.generated_at = data.generated_at|| "";
		this.expires_on_seconds = data.expires_on_seconds|| -1;
		this.trace_storage = data.trace_storage || false; // Default to false if not provided
		this.description = data.description || ""; // Default to empty string if not provided
	}

	static async getFromDbData(activity_id:number, current_user_id: number) : Promise<Activity> {
		const results = await db.Functions.runViewQuery(
			db.Views.Activity.byActivityIdAndUserId,
			{ activity_id, current_user_id }
		);
		if (results.length === 0) {
			throw new NotFoundError(`Activity with ID ${activity_id} not found for user ID ${current_user_id}.`);
		} else if (results.length > 1) {
			logger.warn(`Multiple activities found with ID ${activity_id} for user ID ${current_user_id}. Using the first one.`);
		}
		return await ActivityToClass(results[0]);
	}
	
	/**
	 * Gets the activity type identifier
	 * 
	 * @static
	 * @returns {string} The activity type string
	 * @description Returns the base activity type. Should be overridden by subclasses.
	 */
	static getType(){
		return 'activity';
    }

	/**
	 * Gets the human-readable name for this activity type
	 * 
	 * @static
	 * @returns {string} The activity type name
	 * @description Returns a user-friendly name for the activity type.
	 */
	static getName(){
		return 'Default Activity';
	}

	/**
	 * Gets a description of this activity type
	 * 
	 * @static
	 * @returns {string} The activity type description
	 * @description Returns a detailed description of what this activity type does.
	 */
	static getDescription(){
		return 'A basic activity with completion state and a place to save results.';
	}

	/**
	 * Gets utility functions specific to this activity type for a given user
	 * 
	 * @static
	 * @async
	 * @param {string} username - The username to get utilities for
	 * @returns {Promise<object>} Object containing utility functions
	 * @description Returns activity-specific utility functions. Base implementation returns empty object.
	 */
	static async getUtils(username : string){
		return {};
	}

	/**
	 * Gets detailed information about this activity instance
	 * 
	 * @async
	 * @returns {Promise<object>} Object containing activity details
	 * @description Returns instance-specific details. Base implementation returns empty object.
	 */
	async getDetails(){
		return {};
	}

	/**
	 * Updates the activity with new data
	 * 
	 * @async
	 * @param {any} data - Data object containing fields to update
	 * @returns {Promise<void>}
	 * @description Patches the activity in the database with provided data.
	 */
	async patch(data : any) {
		let activity = await db.Tables.Activities.findOne({ where: { activity_id: this.activity_id } });
		if (!activity) {
			throw new NotFoundError(`Activity with ID ${this.activity_id} not found`);
		}
		await activity.update(data);
	}

	/**
	 * Removes the activity from the database
	 * 
	 * @async
	 * @returns {Promise<void>}
	 * @description Permanently deletes this activity from the database.
	 */
	async remove() {
		let activity = await db.Tables.Activities.findOne({ where: { activity_id: this.activity_id } });
		if (!activity) {
			throw new NotFoundError(`Activity with ID ${this.activity_id} not found`);
		}
		await activity.destroy();
	}

	/**
	 * Determines if this activity can be opened/launched
	 * 
	 * @returns {boolean} Whether the activity can be opened
	 * @description Base implementation returns false. Should be overridden by openable activity types.
	 */
	canBeOpened() {
		return false;
	} 

	async addParticipants(participants: number[]) {
		// Implementation for adding participants
	}
	
	async removeParticipants(participants: number[]) {
		// Implementation for removing participants
	}

	addPermission(user_id: number, permission: string) {
		// Implementation for adding permission
	}

	removePermission(user_id: number, permission: string) {
		// Implementation for removing permission
	}

	sendXAPITraceForActivity(username: string, verb: string, timestamp : string, resultScore : number, reasonExtension : string) {
	}

	setResult(participant : number, result : number) {
	}

	async saveToFile(filename: string, content: string){
	}

	async readFromFile(filename : string) {
	}

	async localFileExists(filename: string) {
	}

	async getResults(participants: number[], type: string){
	}
	
	async hasResults(participants: number[], type: string){
	}

	async getProgress(participants : number[]){
	} 
	
	async setProgress(participants: number[], progress: number){
	} 
	
	async setMultiCompletion(status : boolean){
	}

	async setCompletion(participant: number, status : boolean){
	}

	async setSuspension(participant : number, status : boolean) {
	}

	async target(participant : number){
		return false;
	}

	open(res : number, participant : number){
		return false;
	}

	initializeMinioClient() {
		//logger.info("MinioClient");
		//logger.info(`Minio Config - Host: ${config.minio.api_host}, Port: ${config.minio.port}, SSL: ${config.minio.useSSL}`);
		//try {
		//	const minioClient = new Client({
		//		endPoint: config.minio.api_host,
		//		port: Number(config.minio.port),
		//		accessKey: config.minio.access_key,
		//		secretKey: config.minio.secret_key,
		//		useSSL: config.minio.useSSL
		//	});
		//	logger.info("MinioClient connected");
		//	return minioClient;
		//} catch (error) {
		//	logger.error("Error initializing MinioClient: ");
		//	logger.error(error);
		//	throw error;
		//}
	}

	async generatePresignedFileUrl() {
		//let path = `${config.minio.outputs_dir}/${this._id}/${config.minio.traces_file}`;
		//logger.info(path);
		//let minioClient = this.initializeMinioClient();
		//if (await this.fileExists(minioClient, path)) {
		//	let presignedUrl = null;	
		//	let time_before_expiration=config.minio.presigned_url_expiration_time_in_second;
		//	presignedUrl = await this.getPresignedUrl(minioClient, path, time_before_expiration);
		//	const now=new Date().toJSON();
		//	this.extra_data.miniotrace={
		//		presignedUrl:presignedUrl,
		//		generated_at:now,
		//		expire_on_seconds:time_before_expiration
		//	};
		//} else {
		//	throw `Error the file ${path} don't exist in minio`;
		//}
	}

/**
	 * Retrieve file content from Minio
	 * @param {Object} minioClient - Minio Client object
	 * @param {string} file - File path
	 * @returns {Promise<string>}
	 */
	async getFile(minioClient : Object, file : string) {
		//try {
		//	const objectStream = await minioClient.getObject(config.minio.bucket, file);
		//	objectStream.setEncoding('utf-8');
		//	let content = '';
		//	for await (const chunk of objectStream) {
		//		content += chunk;
		//	}
		//	return content;
		//} catch (err) {
		//	logger.error(`Error fetching file: ${err.message}`);
		//	throw err;
		//}
	}
	
	/**
	 * Check if the file exists in Minio bucket
	 * @param {Object} minioClient - Minio Client object
	 * @param {string} path - File path
	 * @returns {Promise<boolean>}
	 */
	async fileExists(minioClient : Object, path : string) {
		//logger.debug("Minio : fileExists");
		//try {
		//	const objectsStream = await minioClient.listObjectsV2(config.minio.bucket, path);
		//	const iterator = objectsStream[Symbol.asyncIterator]();
		//	const nextValue = await iterator.next();
		//	return !nextValue.done;
		//} catch (err) {
		//	logger.error(`Error checking file existence: ${err.message}`);
		//	return false;
		//}
	}
	
	/**
	 * Generate a presigned URL for a file in Minio
	 * @param {Object} minioClient - Minio Client object
	 * @param {string} path - File path
	 * @returns {Promise<string>}
	 */
	async getPresignedUrl(minioClient : Object, path : string, time: string) {
		//logger.info("Minio : getPresignedUrl");
		//try {
		//	const presignedUrl = await minioClient.presignedGetObject(config.minio.bucket, path, time);
		//	logger.info(presignedUrl);
		//	return presignedUrl;
		//} catch (err) {
		//	logger.error(`Error generating presigned URL: ${err.message}`);
		//	throw err;
		//}
	}
}