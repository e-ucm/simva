import { db } from "@/lib/db";
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
	allocated_user: boolean;
	allocated_user_id?:number;
	allocated_username?:string;
	allocated_isToken?:string;
	allocated_token?:string;

	current_user_id?:number;
	current_user_username?:string;
	current_user_permission?:string;

 	/**
 	 * The ID of the session this activity belongs to
 	 */
 	session_id: number;
	session_active?:boolean;
	session_start_date?:Date;
	session_end_date?:Date;
	
	activity_initialized?: boolean;
	activity_progress?: number;
	activity_completed?: boolean;

	/**
	 * Unique identifier for this activity
	 */
	activity_id: number;
	
	/**
	 * Human-readable name for the activity
	 */
	activity_name: string;
	
	/**
	 * Type of activity (e.g., 'limesurvey', 'gameplay', 'manual')
	 */
	activity_type: string;

	activity_order:number;
	
	/**
	 * Whether trace data storage is enabled for this activity
	 */
	activity_trace_storage: boolean;

	/**
	 * Whether this activity can be restarted by participants
	 */
	activity_can_be_restarted: boolean;

	/**
	 * Optional description of the activity
	 */
	activity_description?: string;
	
	/**
	 * Timestamp when the activity was created
	 */
	createdAt?: Date;
	
	/**
	 * Timestamp when the activity was last updated
	 */
	updatedAt?: Date;
	
	/**
	 * Pre-signed URL for accessing activity resources (optional)
	 */
	activity_presignedUrl?: string;
	
	/**
	 * Timestamp when presigned URL was generated (optional)
	 */
	activity_generated_at?: Date;
	
	/**
	 * Expiration time for presigned URL in seconds (optional)
	 */
	activity_expire_on_seconds?: number;

	/**
	 * Whether this activity complies with GDPR requirements
	 */
	activity_comply_with_GDPR?: boolean;
	
	/**
	 * Creates a new Activity instance
	 * 
	 * @param {any} data - Raw data object containing activity properties
	 * @description Initializes activity properties from provided data object.
	 * Sets default values for optional properties.
	 */
	constructor(allocated: boolean, data: any) {
		this.allocated_user = allocated;
		this.session_id = data.session_id;
		this.activity_id = data.activity_id;
		this.activity_name = data.activity_name;
		this.activity_order = data.activity_order;
		this.activity_type = data.activity_type;
		this.activity_trace_storage = data.activity_trace_storage || false; // Default to false if not provided
		this.activity_can_be_restarted = data.activity_can_be_restarted || false;
		if(this.allocated_user) {
			this.session_active = data.session_active;
			this.session_start_date = data.session_start_date;
			this.session_end_date = data.session_end_date;
			this.activity_initialized = data.activity_initialized;
			this.activity_progress = data.activity_progress;
			this.activity_completed = data.activity_completed;
		} else {
			this.activity_description = data.activity_description || ""; // Default to empty string if not provided
			this.activity_comply_with_GDPR = data.activity_comply_with_GDPR || false;
			this.createdAt = data.createdAt;
			this.updatedAt = data.updatedAt;
			this.activity_presignedUrl = data.activity_presignedUrl || "";
			this.activity_generated_at = data.activity_generated_at || "";
			this.activity_expire_on_seconds = data.activity_expire_on_seconds || -1;
		}
	}
    /**
     * Retrieves all activities for a session with user access control.
     * Returns activities visible to the specified user or allocated participant.
     * 
     * @static
     * @async
     * @method getAllFromDbData
     * @param {number} session_id - ID of the session containing activities
     * @param {number} user_id - ID of the user or participant requesting activities
     * @param {boolean} [allocated=false] - Whether the user is an allocated participant
     * @returns {Promise<Activity[]>} Promise resolving to array of activity instances
     * @throws {Error} When database query fails or ActivityToClass factory fails
     * 
     * @example
     * ```typescript
     * const activities = await Activity.getAllFromDbData(123, 456, false);
     * ```
     */
    static async getAllFromDbData(session_id: number, user_id: number, allocated: boolean = false): Promise<Activity[]> {
        let activities;
		if(allocated) {
			activities = await db.Functions.runViewQuery(
				db.Views.Activity.bySessionIdParticipantId,
				{ session_id: session_id, participant_id : user_id }
			);
		} else {
			activities = await db.Functions.runViewQuery(
				db.Views.Activity.bySessionIdUserId,
				{ session_id: session_id, current_user_id : user_id }
			);
		}
		logger.debug({activities} , "Activities data from view");
		const { ActivityToClass } = await import("@/lib/mappers/activities/ActivityToClass");
		return await Promise.all(activities.map(async (activity: any) => await ActivityToClass(activity.activity_id, user_id, allocated, activity)));
    }

    /**
     * Retrieves a single activity by ID with user access control.
     * Uses factory pattern to return appropriate activity subclass instance.
     * 
     * @static
     * @async
     * @method getFromDbData
     * @param {number} activity_id - Unique identifier of the activity
     * @param {number} user_id - ID of the user requesting the activity
     * @param {boolean} [allocated=false] - Whether the user is an allocated participant
     * @param {any} [activityData=null] - Optional pre-fetched activity data
     * @returns {Promise<Activity>} Promise resolving to activity instance
     * @throws {NotFoundError} When activity is not found or user lacks access
     * 
     * @example
     * ```typescript
     * const activity = await Activity.getFromDbData(789, 456, true);
     * ```
     */
	static async getFromDbData(activity_id:number, user_id: number, allocated : boolean = false, activityData : any = null) : Promise<Activity> {
		let results;
		if(allocated) {
			results = await db.Functions.runViewQuery(
				db.Views.Activity.byActivityIdAndParticipantId,
				{ activity_id, allocated_user_id : user_id }
			);
		} else {
			results = await db.Functions.runViewQuery(
				db.Views.Activity.byActivityIdAndUserId,
				{ activity_id, current_user_id : user_id }
			);
		}
		if (results.length === 0) {
			throw new NotFoundError(`Activity with ID ${activity_id} not found for user ID ${user_id}.`);
		} else if (results.length > 1) {
			logger.warn(`Multiple activities found with ID ${activity_id} for user ID ${user_id}. Using the first one.`);
		}
		activityData = results[0];
		const { ActivityToClass } = await import("@/lib/mappers/activities/ActivityToClass");
		return await ActivityToClass(activity_id, user_id, allocated, activityData);
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
	 * @method getDetails
	 * @returns {Promise<object>} Object containing activity details
	 * @description Returns instance-specific details. Base implementation returns empty object.
	 */
	async getDetails(): Promise<object>{
		return {};
	}

	/**
	 * Updates the activity with new data.
	 * Patches the activity in the database with provided data.
	 * 
	 * @async
	 * @method patch
	 * @param {any} data - Data object containing fields to update
	 * @returns {Promise<void>} Promise that resolves when update is complete
	 * @throws {NotFoundError} When activity is not found in database
	 * 
	 * @example
	 * ```typescript
	 * await activity.patch({ activity_name: 'Updated Name' });
	 * ```
	 */
	async patch(data : any): Promise<void> {
		let activity = await db.Tables.Activities.findOne({ where: { activity_id: this.activity_id } });
		if (!activity) {
			throw new NotFoundError(`Activity with ID ${this.activity_id} not found`);
		}
		await activity.update(data);
	}

	/**
	 * Removes the activity from the database.
	 * Permanently deletes this activity from the database.
	 * 
	 * @async
	 * @method remove
	 * @returns {Promise<void>} Promise that resolves when deletion is complete
	 * @throws {NotFoundError} When activity is not found in database
	 * 
	 * @example
	 * ```typescript
	 * await activity.remove();
	 * ```
	 */
	async remove(): Promise<void> {
		let activity = await db.Tables.Activities.findOne({ where: { activity_id: this.activity_id } });
		if (!activity) {
			throw new NotFoundError(`Activity with ID ${this.activity_id} not found`);
		}
		await activity.destroy();
	}

	/**
	 * Determines if this activity can be opened/launched.
	 * Base implementation returns false. Should be overridden by openable activity types.
	 * 
	 * @method canBeOpened
	 * @returns {boolean} Whether the activity can be opened
	 * 
	 * @example
	 * ```typescript
	 * if (activity.canBeOpened()) {
	 *   // Activity can be launched
	 * }
	 * ```
	 */
	canBeOpened(): boolean {
		return false;
	} 

	/**
	 * Adds participants to this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method addParticipants
	 * @param {number[]} participants - Array of participant IDs to add
	 * @returns {Promise<void>} Promise that resolves when participants are added
	 */
	async addParticipants(participants: number[]): Promise<void> {
		// Implementation for adding participants
	}
	
	/**
	 * Removes participants from this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method removeParticipants
	 * @param {number[]} participants - Array of participant IDs to remove
	 * @returns {Promise<void>} Promise that resolves when participants are removed
	 */
	async removeParticipants(participants: number[]): Promise<void> {
		// Implementation for removing participants
	}

	/**
	 * Adds a permission for a user on this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @method addPermission
	 * @param {number} user_id - ID of the user to grant permission
	 * @param {string} permission - Permission level to grant
	 * @returns {void}
	 */
	addPermission(user_id: number, permission: string): void {
		// Implementation for adding permission
	}

	/**
	 * Removes a permission for a user on this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @method removePermission
	 * @param {number} user_id - ID of the user to revoke permission
	 * @param {string} permission - Permission level to revoke
	 * @returns {void}
	 */
	removePermission(user_id: number, permission: string): void {
		// Implementation for removing permission
	}

	/**
	 * Sends an xAPI trace for this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @method sendXAPITraceForActivity
	 * @param {string} username - Username of the participant
	 * @param {string} verb - xAPI verb for the trace
	 * @param {string} timestamp - Timestamp of the activity
	 * @param {number} resultScore - Score result for the activity
	 * @param {string} reasonExtension - Reason extension for the trace
	 * @returns {void}
	 */
	sendXAPITraceForActivity(username: string, verb: string, timestamp : string, resultScore : number, reasonExtension : string): void {
	}

	/**
	 * Sets a result for a participant in this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @method setResult
	 * @param {number} participant - ID of the participant
	 * @param {number} result - Result value to set
	 * @returns {void}
	 */
	setResult(participant : number, result : number): void {
	}

	/**
	 * Saves content to a file for this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method saveToFile
	 * @param {string} filename - Name of the file to save
	 * @param {string} content - Content to save to the file
	 * @returns {Promise<void>} Promise that resolves when file is saved
	 */
	async saveToFile(filename: string, content: string): Promise<void>{
	}

	/**
	 * Reads content from a file for this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method readFromFile
	 * @param {string} filename - Name of the file to read
	 * @returns {Promise<string | null>} Promise resolving to file content or null if not found
	 */
	async readFromFile(filename : string): Promise<string | null> {
		return null;
	}

	/**
	 * Checks if a local file exists for this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method localFileExists
	 * @param {string} filename - Name of the file to check
	 * @returns {Promise<boolean>} Promise resolving to true if file exists, false otherwise
	 */
	async localFileExists(filename: string): Promise<boolean> {
		return false;
	}

	/**
	 * Retrieves results for participants in this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method getResults
	 * @param {number[]} participants - Array of participant IDs
	 * @param {string} type - Type of results to retrieve
	 * @returns {Promise<any[]>} Promise resolving to array of participant results
	 */
	async getResults(participants: number[], type: string): Promise<any[]>{
		return [];
	}
	
	/**
	 * Checks if participants have results for this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method hasResults
	 * @param {number[]} participants - Array of participant IDs
	 * @param {string} type - Type of results to check
	 * @returns {Promise<boolean>} Promise resolving to true if participants have results
	 */
	async hasResults(participants: number[], type: string): Promise<boolean>{
		return false;
	}

	/**
	 * Retrieves progress information for participants.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method getProgress
	 * @param {number[]} participants - Array of participant IDs
	 * @returns {Promise<number[]>} Promise resolving to array of progress values
	 */
	async getProgress(participants : number[]): Promise<number[]>{
		return [];
	} 
	
	/**
	 * Sets progress for participants in this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method setProgress
	 * @param {number[]} participants - Array of participant IDs
	 * @param {number} progress - Progress value to set (0-100)
	 * @returns {Promise<void>} Promise that resolves when progress is set
	 */
	async setProgress(participants: number[], progress: number): Promise<void>{
	} 
	
	/**
	 * Sets multi-completion status for the activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method setMultiCompletion
	 * @param {boolean} status - Completion status to set
	 * @returns {Promise<void>} Promise that resolves when multi-completion is set
	 */
	async setMultiCompletion(status : boolean): Promise<void>{
	}

	/**
	 * Sets completion status for a specific participant.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method setCompletion
	 * @param {number} participant - Participant ID
	 * @param {boolean} status - Completion status to set
	 * @returns {Promise<void>} Promise that resolves when completion status is set
	 */
	async setCompletion(participant: number, status : boolean): Promise<void>{
	}

	/**
	 * Sets suspension status for a specific participant.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method setSuspension
	 * @param {number} participant - Participant ID
	 * @param {boolean} status - Suspension status to set
	 * @returns {Promise<void>} Promise that resolves when suspension status is set
	 */
	async setSuspension(participant : number, status : boolean): Promise<void> {
	}

	/**
	 * Determines if a participant is a target for this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method target
	 * @param {number} participant - Participant ID to check
	 * @returns {Promise<boolean>} Promise resolving to true if participant is a target
	 */
	async target(participant : number): Promise<boolean>{
		return false;
	}

	/**
	 * Opens an activity for a specific participant.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @method open
	 * @param {number} res - Resource identifier
	 * @param {number} participant - Participant ID
	 * @returns {boolean} Returns false as default stub implementation
	 */
	open(res : number, participant : number): boolean{
		return false;
	}

	/**
	 * Initializes MinIO client for file operations.
	 * Currently commented out - stub implementation for future use.
	 * 
	 * @method initializeMinioClient
	 * @returns {void} No return value
	 */
	initializeMinioClient(): void {
		throw new Error("MinIO client initialization not implemented yet");
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

	/**
	 * Generates a presigned URL for file access.
	 * Currently commented out - stub implementation for future MinIO integration.
	 * 
	 * @async
	 * @method generatePresignedFileUrl
	 * @returns {Promise<void>} Promise that resolves when presigned URL is generated
	 */
	async generatePresignedFileUrl(): Promise<void> {
		throw new Error("Presigned URL generation not implemented yet");
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
	/**
	 * Retrieves a file from MinIO client.
	 * Currently commented out - stub implementation for future MinIO integration.
	 * 
	 * @async
	 * @method getFile
	 * @param {Object} minioClient - MinIO client instance
	 * @param {string} file - File path to retrieve
	 * @returns {Promise<void>} Promise that resolves when file is retrieved
	 */
	async getFile(minioClient : Object, file : string): Promise<void> {
		throw new Error("File retrieval not implemented yet");
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
	/**
	 * Checks if a file exists in MinIO storage.
	 * Currently commented out - stub implementation for future MinIO integration.
	 * 
	 * @async
	 * @method fileExists
	 * @param {Object} minioClient - MinIO client instance
	 * @param {string} path - File path to check
	 * @returns {Promise<boolean>} Promise resolving to true if file exists
	 */
	async fileExists(minioClient : Object, path : string): Promise<boolean> {
		throw new Error("File existence check not implemented yet");
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
	/**
	 * Gets a presigned URL for file access with expiration time.
	 * Currently commented out - stub implementation for future MinIO integration.
	 * 
	 * @async
	 * @method getPresignedUrl
	 * @param {Object} minioClient - MinIO client instance
	 * @param {string} path - File path to get URL for
	 * @param {string} time - Expiration time for the URL
	 * @returns {Promise<string>} Promise resolving to the presigned URL
	 */
	async getPresignedUrl(minioClient : Object, path : string, time: string): Promise<string> {
		throw new Error("Presigned URL generation not implemented yet");
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

	/**
	 * Converts the activity instance to a JSON representation.
	 * 
	 * @method toJSON
	 * @returns {object} JSON object representing the activity
	 */
	toJSON(): object {
		let obj = {
			session_id: this.session_id,
			activity_id: this.activity_id,
			activity_name: this.activity_name,
			activity_type: this.activity_type,
			activity_order: this.activity_order,
			activity_trace_storage: this.activity_trace_storage,
			activity_can_be_restarted: this.activity_can_be_restarted,
			activity_description: this.activity_description,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
			activity_presignedUrl: this.activity_presignedUrl,
			activity_generated_at: this.activity_generated_at,
			activity_expire_on_seconds: this.activity_expire_on_seconds,
			activity_comply_with_GDPR: this.activity_comply_with_GDPR
		};
		if(this.allocated_user) {
			 return {
				...obj,
				session_active: this.session_active,
				session_start_date: this.session_start_date,
				session_end_date: this.session_end_date,
				activity_initialized: this.activity_initialized,
				activity_progress: this.activity_progress,
				activity_completed: this.activity_completed
			};
		} else {
			return {
				...obj,
				allocated_user: this.allocated_user
			};
		}
	}
}