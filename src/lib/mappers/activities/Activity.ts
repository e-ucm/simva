import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { AuthentificationError, NotFoundError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { minioClient } from "@/lib/utils/minioclient";
import { JSScormTracker } from "js-tracker";
import { ActivityCompletion } from "../ActivityCompletion/ActivityCompletion";
import { ActivityMappingResult } from "../ActivityCompletion/ActivityMappingResult";
import { lrsclient } from "@/lib/utils/LRSclient";
import { User } from "../Users/User";

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
	allocated_activity_result?: ActivityCompletion;

	current_user_id?:number;
	current_user_username?:string;
	current_user_permission?:string;

 	/**
 	 * The ID of the session this activity belongs to
 	 */
	simlet_id: number;
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
		this.simlet_id = data.simlet_id;
		this.session_id = data.session_id;
		this.activity_id = data.activity_id;
		this.activity_name = data.activity_name;
		this.activity_order = data.activity_order;
		this.activity_type = data.activity_type;
		this.activity_trace_storage = data.activity_trace_storage || false; // Default to false if not provided
		this.activity_can_be_restarted = data.activity_can_be_restarted || false;
		if(this.allocated_user) {
			this.session_active = data.session_active;
			this.session_start_date = data.session_start_date ? new Date(data.session_start_date) : undefined;
			this.session_end_date = data.session_end_date ? new Date(data.session_end_date) : undefined;
			this.allocated_activity_result = new ActivityCompletion(data);
		} else {
			this.activity_description = data.activity_description || ""; // Default to empty string if not provided
			this.activity_comply_with_GDPR = data.activity_comply_with_GDPR || false;
			this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
			this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
			this.activity_presignedUrl = data.activity_presignedUrl || "";
			this.activity_generated_at = data.activity_generated_at ? new Date(data.activity_generated_at) : undefined;
			this.activity_expire_on_seconds = data.activity_expire_on_seconds || -1;
			this.current_user_id = data.current_user_id;
			this.current_user_username = data.current_user_username;
			this.current_user_permission = data.current_user_permission;
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

	async getAllCurrentParticipantsId(participants_id?: number[]): Promise<number[]> {
		if(this.allocated_user) {
			participants_id = [this.allocated_user_id!];
		} else if (!participants_id || participants_id.length === 0) {
			participants_id = await ActivityCompletion.getAllIdsFromDbData(this.activity_id);
		}
		return participants_id;
	}

	/**
	 * Give the target resource for a participant if the activity is openable.
	 * 
	 * @async
	 * @method target
	 * @param {number[]} participants_id - Array of participant IDs to check
	 * @returns {Promise<Map<number, string>>} Promise resolving to a map of participant IDs to target resource URLs or identifiers
	 * @description Returns the target resources for multiple participants if the activity can be opened. Base implementation returns undefined.
	 * Should be overridden by openable activity types to provide actual target resources.
	 * 
	 * @example
	 * ```typescript
	 * const targetResource = await activity.target(participantIds);
	 * if (targetResource) {
	 *   // Use targetResource to launch activity for participants
	 * }
	 * ```
	 */
	async target(participants_id?: number[]): Promise<ActivityMappingResult<string>> {
		return new ActivityMappingResult(new Map<number, string>());
	}

	async getCurrentCompletionData(participants_id?: number[], columns?: string[]): Promise<ActivityCompletion[]> {
		let data;
		if(this.allocated_user) {
			participants_id = [this.allocated_user_id!];
			data = await ActivityCompletion.getAllFromDbData(this.activity_id, columns, participants_id);
		} else if (!participants_id || participants_id.length === 0) {
			data = await ActivityCompletion.getAllFromDbData(this.activity_id, columns);
		} else {
			data = await ActivityCompletion.getAllFromDbData(this.activity_id, columns, participants_id);
		}
		return data;
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
	async getInitialized(participants_id?: number[]): Promise<ActivityMappingResult<boolean>>{
		let progressData= await this.getCurrentCompletionData(participants_id, ["participant_id", "activity_initialized"]);
		let progressMap = new Map<number, boolean>();
		for (const cd of progressData) {
			progressMap.set(cd.participant_id, cd.activity_initialized);
		}
		return new ActivityMappingResult(progressMap);
	}

	/**
	 * Sets initialized status for participants in this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method setInitialized
	 * @param {boolean} initialized - Initialized status to set
	 * @param {number[]} participants_id - Array of participant IDs
	 * @returns {Promise<ActivityCompletion[]>} Promise that resolves when initialized status is set
	 */
	async setInitialized(initialized: boolean, participants_id?: number[]): Promise<ActivityCompletion[]>{
		let progressData = await this.getCurrentCompletionData(participants_id);
		for (const cd of progressData) {
			await cd.update({ activity_initialized: initialized });
			cd.activity_initialized = initialized; // Update local instance to reflect change
		}
		return progressData;
	}

	/**
	 * Retrieves progress information for participants.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method getProgress
	 * @param {number[]} participants_id - Array of participant IDs
	 * @returns {Promise<number[]>} Promise resolving to array of progress values
	 */
	async getProgress(participants_id?: number[]): Promise<ActivityMappingResult<number>>{
		let progressData= await this.getCurrentCompletionData(participants_id, ["participant_id", "activity_progress"]);
		let progressMap = new Map<number, number>();
		for (const cd of progressData) {
			progressMap.set(cd.participant_id, cd.activity_progress);
		}
		return new ActivityMappingResult(progressMap);
	}
	
	/**
	 * Sets progress for participants in this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method setProgress
	 * @param {number} progress - Progress value to set (0-100)
	 * @param {number[]} participants_id - Array of participant IDs
	 * @returns {Promise<ActivityCompletion[]>} Promise that resolves when progress is set
	 */
	async setProgress(progress: number, participants_id?: number[]): Promise<ActivityCompletion[]>{
		let progressData = await this.getCurrentCompletionData(participants_id);
		for (const cd of progressData) {
			await cd.update({ activity_progress: progress });
			cd.activity_progress = progress; // Update local instance to reflect change
		}
		return progressData;
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
	async getCompletion(participants_id?: number[]): Promise<ActivityMappingResult<boolean>>{
		let progressData= await this.getCurrentCompletionData(participants_id, ["participant_id", "activity_completed"]);
		let progressMap = new Map<number, boolean>();
		for (const cd of progressData) {
			progressMap.set(cd.participant_id, cd.activity_completed);
		}
		return new ActivityMappingResult(progressMap);
	}

	/**
	 * Sets progress for participants in this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method setCompletion
	 * @param {boolean} completed - Completion status to set
	 * @param {number[]} participants_id - Array of participant IDs
	 * @returns {Promise<ActivityCompletion[]>} Promise that resolves when completion is set
	 */
	async setCompletion(completed: boolean, participants_id?: number[]): Promise<ActivityCompletion[]>{
		let data = await this.getCurrentCompletionData(participants_id);
		for (const cd of data) {
			await cd.update({ activity_completed: completed });
			cd.activity_completed = completed; // Update local instance to reflect change
		}
		return data;
	} 
	
	/**
	 * Sets multi-completion status for the activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method setMultiCompletion
	 * @param {boolean} status - Completion status to set
	 * @returns {Promise<ActivityCompletion[]>} Promise that resolves when multi-completion is set
	 */
	async setMultiCompletion(status : boolean): Promise<ActivityCompletion[]> {
		return await this.setCompletion(status);
	}

	/**
	 * Sets suspension status for a specific participant.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method setSuspension
	 * @param {boolean} status - Suspension status to set
	 * @param {number[]} participants_id - Array of participant IDs to set suspension for
	 * @returns {Promise<ActivityCompletion[]>} Promise that resolves when suspension status is set
	 */
	async setSuspension(status : boolean, participants_id?: number[]): Promise<ActivityCompletion[]> {
		let completionData = await this.getCurrentCompletionData(participants_id);
		for (const cd of completionData) {
			await cd.update({ activity_suspended: status });
			cd.activity_suspended = status; // Update local instance to reflect change
		}
		return completionData;
	}

	async getSuspension(participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
		let suspensionData= await this.getCurrentCompletionData(participants_id, ["participant_id", "activity_suspended"]);
		let suspensionMap = new Map<number, boolean>();
		for (const cd of suspensionData) {
			suspensionMap.set(cd.participant_id, cd.activity_suspended);
		}
		return new ActivityMappingResult(suspensionMap);
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
	async sendXAPITraceForActivity(username: string, verb: string, timestamp : string, resultScore : number, reasonExtension : string): Promise<void> {
		let jstracker = new JSScormTracker();
		jstracker.trackerSettings.actor_homePage = config.externalUrl;
		jstracker.trackerSettings.actor_name = username;
		jstracker.start(); // Initialize the tracker before using it
		let scormActivityTracker = jstracker.scorm(`${config.externalUrl}/activity/${this.activity_id}`, jstracker.SCORMTYPE.ACTVITY);
		let statement;
		switch(verb) {
			case "initialized":
				statement = scormActivityTracker.initialized().statement;
				break;
			case "resumed":
				statement = scormActivityTracker.resumed().statement;
				break;
			case "suspended":
				statement = scormActivityTracker.suspended().statement;
				break;
			case "terminated":
				scormActivityTracker.IsInitialized = false;
				scormActivityTracker.InitializedTime = new Date(timestamp);
				statement = scormActivityTracker.terminated().statement;
				break;
			default:
				logger.warn(`Unsupported verb ${verb} for xAPI trace`);
		}
		logger.info(statement? statement.toXAPI() : "No statement generated", "XAPI Statement:");
	}

	async canSendStatementsLRS(): Promise<boolean> {
        if(this.session_active) {
			if(this.session_end_date && Date.now() > this.session_end_date.getTime()) {
				throw new AuthentificationError("The session for this activity has ended, cannot send statements to LRS.");
			} else if(this.session_start_date && Date.now() < this.session_start_date.getTime()) {
				throw new AuthentificationError("The session for this activity has not started yet, cannot send statements to LRS.");
			}
			if(this.activity_completed) {
				throw new AuthentificationError("The activity is already completed, cannot send statements to LRS.");
			}	
			if(this.activity_order === 1) {
				return true; // First activity can always send statements if session is active
			} else {
				// For subsequent activities, check if the previous activity is completed
				let previousActivities;
				if(this.allocated_user) {
					previousActivities = await Activity.getPreviousAllocatedActivity(this.activity_id, this.allocated_user_id!);
				} else {
					throw new AuthentificationError("Cannot verify previous activity completion for non-allocated user, cannot send statements to LRS.");
				}
				for(const previousActivity of previousActivities) {
					if(!previousActivity.activity_completed && !previousActivity.activity_can_be_restarted) {
						throw new AuthentificationError(`The previous activity ${previousActivity.activity_name} is not completed, cannot send statements to LRS.`);
					}
				}
			}
			return true;
		}
        throw new AuthentificationError("The session for this activity is not active, cannot send statements to LRS.");
    }

	static async getPreviousAllocatedActivity(activity_id: number, allocated_user_id: number): Promise<Activity[]> {
		const previousActivitiesData = await db.Functions.runViewQuery(
			db.Views.Activity.byPreviousActivityIdAndParticipantId,
			{ activity_id, allocated_user_id }
		);
		const { ActivityToClass } = await import("@/lib/mappers/activities/ActivityToClass");
		return await Promise.all(previousActivitiesData.map(async (activity: any) =>
			await ActivityToClass(activity.activity_id, allocated_user_id, true, activity)
	));
	}

	async sendStatementsLRSForActivity(current_user_id: number, body: any): Promise<number[]> {
		let ids = await lrsclient.setStatement(body, this.activity_id, (await User.getFromDbData(current_user_id)).username);
		return ids;
	}

	/**
	 * Checks if participants have results for this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method hasResults
	 * @param {string} type - Type of results to check
	 * @param {number[]} participants_id - Array of participant IDs
	 * @returns {Promise<boolean>} Promise resolving to true if participants have results
	 */
	async hasResults(type: string, participants_id?: number[]): Promise<boolean>{
		return false;
	}

	/**
	 * Sets a result for a participant in this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @method setResult
	 * @param {any} result - Result value to set
	 * @param {number[]} participants_id -  Array of participant IDs to set results for
	 * @returns {void}
	 */
	async setResult(result: any, participants_id?: number[]): Promise<void> {
		throw new Error("setResult method not implemented for this activity type");
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
		return;
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
	 * Generates a presigned URL for file access.
	 * Currently commented out - stub implementation for future MinIO integration.
	 * 
	 * @async
	 * @method generatePresignedFileUrl
	 * @returns {Promise<void>} Promise that resolves when presigned URL is generated
	 */
	async generatePresignedFileUrl(): Promise<any> {
		let path = `${config.minio.outputs_dir}/${this.activity_id}/${config.minio.traces_file}`;
		logger.info(path);
		if (await minioClient.fileExists(path)) {
			let presignedUrl = null;	
			let time_before_expiration=config.minio.presigned_url_expiration_time_in_second;
			presignedUrl = await minioClient.getPresignedFileUrl(this.activity_id as unknown as string);
			const now=new Date().toJSON();
			return {
				url: presignedUrl,
				generated_at: now,
				expire_on_seconds: time_before_expiration
			};
		} else {
			throw `Error the file ${path} don't exist in minio`;
		}
	}
	
	/**
	 * Retrieve file content from Minio client.
	 * @param {string} file - File path
	 * @returns {Promise<string>}
	 */
	/**
	 * Retrieves a file from MinIO client.
	 * Currently commented out - stub implementation for future MinIO integration.
	 * 
	 * @async
	 * @method getFile
	 * @param {string} file - File path to retrieve
	 * @returns {Promise<string>} Promise that resolves to the file content
	 */
	async getFile(file : string): Promise<string> {
		const objectStream = await minioClient.getObject(config.minio.bucket, file) as any;
		objectStream.setEncoding('utf-8');
		let content = '';
		for await (const chunk of objectStream) {
			content += chunk;
		}
		return content;
	}
	/**
	 * Gets a presigned URL for file access with expiration time.
	 * Currently commented out - stub implementation for future MinIO integration.
	 * 
	 * @async
	 * @method getPresignedUrl
	 * @returns {Promise<string>} Promise resolving to the presigned URL
	 */
	async getPresignedUrl(): Promise<string> {
		logger.info("Minio : getPresignedUrl");
		const presignedUrl = await minioClient.getPresignedFileUrl(this.activity_id as unknown as string);
		logger.info(presignedUrl);
		return presignedUrl;
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
				allocated_activity_result: this.allocated_activity_result?.toJSON()
			};
		} else {
			return {
				...obj,
				allocated_user: this.allocated_user
			};
		}
	}
}