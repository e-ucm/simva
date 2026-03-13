import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { AuthentificationError, BadRequestError, NotFoundError, NotImplementedError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { minioClient } from "@/lib/utils/minioclient";
import { JSScormTracker } from "js-tracker";
import { ActivityCompletion } from "../ActivityCompletion/ActivityCompletion";
import { ActivityMappingResult } from "../ActivityCompletion/ActivityMappingResult";
import { lrsclient } from "@/lib/utils/LRSclient";
import { User } from "../Users/User";
import KafkaClient, { KafkaOpts } from "@/lib/utils/kafkaclient";

const kafkaEventConfig: KafkaOpts = {
	clientId: config.kafkaEvent.clientId,
	brokers: config.kafkaEvent.brokers,
	topic: config.kafkaEvent.topic,
	groupId: config.kafkaEvent.groupId
};

const kafkaEventClient = new KafkaClient(kafkaEventConfig);

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
	allocated_isToken?:boolean;
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
	activity_presignedUrl?: string;
	activity_presignedUrl_generated_at?: Date;
	activity_presignedUrl_expired_at?: Date;

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
		this.activity_id = data.activity_id;
		this.activity_name = data.activity_name;
		this.activity_order = data.activity_order;
		this.activity_type = data.activity_type;
		this.activity_trace_storage = data.activity_trace_storage || false; // Default to false if not provided
		this.activity_can_be_restarted = data.activity_can_be_restarted || false;
		this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
		this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
		if(this.allocated_user) {
			this.session_id = data.allocated_session_id;
			this.allocated_user_id = data.allocated_user_id ?? data.participant_id;
			this.allocated_username = data.allocated_username ?? data.participant_username;
			this.allocated_token = data.allocated_token ?? data.participant_token;
			this.allocated_isToken = data.allocated_isToken ? Boolean(data.allocated_isToken) : false;
			this.session_active = Boolean(data.session_status == "active");
			this.session_start_date = data.session_start_date ? new Date(data.session_start_date) : undefined;
			this.session_end_date = data.session_end_date ? new Date(data.session_end_date) : undefined;
			this.allocated_activity_result = new ActivityCompletion(data, "all");
			this.activity_description = ""; // No description for allocated activities as they are user-specific instances of the base activity
			this.activity_comply_with_GDPR = false; // GDPR compliance is not relevant for allocated activities as they are user-specific instances of the base activity
		} else {
			this.session_id = data.session_id;
			this.activity_description = data.activity_description || ""; // Default to empty string if not provided
			this.activity_comply_with_GDPR = Boolean(data.activity_comply_with_GDPR) || false;
			this.activity_presignedUrl = data.activity_presignedUrl || "";
			this.activity_presignedUrl_generated_at = data.activity_presignedUrl_generated_at ? new Date(data.activity_presignedUrl_generated_at) : undefined;
			this.activity_presignedUrl_expired_at = data.activity_presignedUrl_expired_at ? new Date(data.activity_presignedUrl_expired_at) : undefined;
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
     * const activities = await Activity.getAllFromDbData(123, false, false, 456);
     * ```
     */
    static async getAllFromDbData(session_id: number, allocated: boolean = false, is_admin: boolean = false, user_id?: number): Promise<Activity[]> {
        let activities;
		if(allocated) {
			if(user_id === undefined) {
				throw new NotFoundError(`Activities for session ID ${session_id} not found for user ID ${user_id}.`);
			}
			activities = await db.Functions.runViewQuery(
				db.Views.Activity.bySessionIdParticipantId,
				{ session_id: session_id, participant_id : user_id }
			);
		} else if (is_admin) {
			const session = await db.Tables.Sessions.findOne({ where: { session_id } });
			if (!session) {
				throw new NotFoundError(`Session with ID ${session_id} not found.`);
			}
			activities = (await db.Tables.Activities.findAll({ where: { session_id } })).map((activity: any) => ({
				...activity.toJSON(),
				simlet_id: session.simlet_id,
				current_user_id: user_id,
				current_user_permission: "FULL",
				current_user_username: "administrator"
			}));
		} else {
			if(user_id === undefined) {
				throw new NotFoundError(`Activities for session ID ${session_id} not found for user ID ${user_id}.`);
			}
			activities = await db.Functions.runViewQuery(
				db.Views.Activity.bySessionIdUserId,
				{ session_id: session_id, current_user_id : user_id }
			);
		}
		logger.debug({activities} , "Activities data from view");
		const { ActivityToClass } = await import("@/lib/mappers/activities/ActivityToClass");
		return await Promise.all(activities.map(async (activity: any) => await ActivityToClass(activity.activity_id, allocated, is_admin, activity, user_id)));
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
	static async getFromDbData(activity_id: number, allocated: boolean = false, is_admin: boolean = false, user_id?: number, activityData: any = null) : Promise<Activity> {
		let results;
		if(allocated) {
			if(user_id === undefined) {
				throw new NotFoundError(`Activity with ID ${activity_id} not found for user ID ${user_id}.`);
			}
			results = await db.Functions.runViewQuery(
				db.Views.Activity.byActivityIdAndParticipantId,
				{ activity_id, allocated_user_id : user_id }
			);
		} else if(is_admin) {
			const activity = await db.Tables.Activities.findOne({ where: { activity_id } });
			if (!activity) {
				throw new NotFoundError(`Activity with ID ${activity_id} not found.`);
			}
			const session = await db.Tables.Sessions.findOne({ where: { session_id: activity.session_id } });
			if (!session) {
				throw new NotFoundError(`Session for activity ID ${activity_id} not found.`);
			}
			results = [{
				...activity.toJSON(),
				simlet_id: session.simlet_id,
				current_user_id: user_id,
				current_user_permission: "FULL",
				current_user_username: "administrator"
			}];
		} else {
			if(user_id === undefined) {
				throw new NotFoundError(`Activity with ID ${activity_id} not found for user ID ${user_id}.`);
			}
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
		return await ActivityToClass(activity_id, allocated, is_admin, activityData, user_id);
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
	 * @returns {Promise<object>} Object containing utility functions
	 * @description Returns activity-specific utility functions. Base implementation returns empty object.
	 */
	static async getUtils(): Promise<object>{
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
		// Map frontend field names to database field names
		const mappedData: any = {};
		if (data.name !== undefined) {
			mappedData.activity_name = data.name;
		}
		if (data.activity_name !== undefined) {
			mappedData.activity_name = data.activity_name;
		}
		if (data.activity_trace_storage !== undefined) {
			mappedData.activity_trace_storage = data.activity_trace_storage;
		}
		if (data.activity_description !== undefined) {
			mappedData.activity_description = data.activity_description;
		}
		if (data.activity_can_be_restarted !== undefined) {
			mappedData.activity_can_be_restarted = data.activity_can_be_restarted;
		}
		if (Object.keys(mappedData).length > 0) {
			await activity.update(mappedData);
		}
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

	async activate(activate: boolean): Promise<void> {
		if(activate) {
			logger.info("Activity activated");
		} else {
			logger.info("Activity desactivated");
		}
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

	async addParticipants(participants_id: number[]): Promise<ActivityCompletion[]> {
		logger.debug(`Adding participants with IDs ${participants_id} to activity with ID ${this.activity_id}`);
		return await ActivityCompletion.createAll(this.activity_id, participants_id);
	}

	async removeParticipants(participants_id: number[]): Promise<void> {
		logger.debug(`Removing participants with IDs ${participants_id} from activity with ID ${this.activity_id}`);
	}

	async getAllCurrentParticipantsId(participants_id?: number[]): Promise<number[]> {
		if(this.allocated_user) {
			participants_id = [this.allocated_user_id!];
		} else if (!participants_id || participants_id.length === 0) {
			participants_id = await ActivityCompletion.getAllIdsFromDbData(this.activity_id);
		}
		return participants_id;
	}

	async getAllCurrentParticipantsUsername(participants_id?: number[]): Promise<Map<number, string>> {
		const participantIds = await this.getAllCurrentParticipantsId(participants_id);
		const usernames: Map<number, string> = new Map<number, string>();
		let users = await User.getFromListDbData(participantIds);
		for (const user of users) {
			usernames.set(user.user_id, user.username);
		}
		return usernames;
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

	async getCurrentCompletionData(data_field: string, participants_id?: number[]): Promise<ActivityCompletion[]> {
		let data;
		if(this.allocated_user) {
			participants_id = [this.allocated_user_id!];
			data = await ActivityCompletion.getAllFromDbData(this.activity_id, data_field, participants_id);
		} else if (!participants_id || participants_id.length === 0) {
			data = await ActivityCompletion.getAllFromDbData(this.activity_id, data_field);
		} else {
			data = await ActivityCompletion.getAllFromDbData(this.activity_id, data_field, participants_id);
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
		let progressData= await this.getCurrentCompletionData("activity_initialized", participants_id);
		let progressMap = new Map<number, boolean>();
		for (const cd of progressData) {
			progressMap.set(cd.participant_id, cd.activity_initialized ?? false);
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
	 * @param {number} participant_id - Participant ID to set initialized status for
	 * @returns {Promise<ActivityCompletion>} Promise that resolves when initialized status is set
	 */
	async setInitialized(initialized: boolean, participant_id: number, sendMessage: boolean = false): Promise<ActivityCompletion>{
		let message = {
			type: "activity_initialized",
			activity_type: this.activity_type,
			activity_id: this.activity_id,
			session_id: this.session_id,
			simlet_id: this.simlet_id,
			participant_id: participant_id,
			username: this.allocated_username ?? this.current_user_username,
			timestamp: new Date().toISOString(),
			status: initialized
		}
		if (sendMessage) {
			await kafkaEventClient.sendMessage(JSON.stringify(message));
		}
		let progressData = await this.getCurrentCompletionData("activity_initialized", [participant_id]);
		if (progressData.length === 0) {
			// Create completion record if it doesn't exist
			const newCompletion = await ActivityCompletion.create(this.activity_id, participant_id);
			await newCompletion.update({ activity_initialized: initialized });
			newCompletion.activity_initialized = initialized;
			return newCompletion;
		}
		for (const cd of progressData) {
			await cd.update({ activity_initialized: initialized });
			cd.activity_initialized = initialized; // Update local instance to reflect change
		}
		return progressData[0];
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
		let progressData= await this.getCurrentCompletionData("activity_progress", participants_id);
		let progressMap = new Map<number, number>();
		for (const cd of progressData) {
			progressMap.set(cd.participant_id, cd.activity_progress ?? 0);
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
	 * @param {number} participant_id - Participant ID to set progress for
	 * @returns {Promise<ActivityCompletion>} Promise that resolves when progress is set
	 */
	async setProgress(progress: number, participant_id: number, sendMessage: boolean = false): Promise<ActivityCompletion>{
		let message = {
			type: "activity_progressed",
			activity_type: this.activity_type,
			activity_id: this.activity_id,
			session_id: this.session_id,
			simlet_id: this.simlet_id,
			participant_id: participant_id,
			username: this.allocated_username ?? this.current_user_username,
			timestamp: new Date().toISOString(),
			progress: progress
		}
		if (sendMessage) {
			await kafkaEventClient.sendMessage(JSON.stringify(message));
		}
								
		let progressData = await this.getCurrentCompletionData("activity_progress", [participant_id]);
		if (progressData.length === 0) {
			// Create completion record if it doesn't exist
			const newCompletion = await ActivityCompletion.create(this.activity_id, participant_id);
			await newCompletion.update({ activity_progress: progress });
			newCompletion.activity_progress = progress;
			return newCompletion;
		}
		for (const cd of progressData) {
			await cd.update({ activity_progress: progress });
			cd.activity_progress = progress; // Update local instance to reflect change
		}
		return progressData[0];
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
		let progressData= await this.getCurrentCompletionData("activity_completed", participants_id);
		let progressMap = new Map<number, boolean>();
		for (const cd of progressData) {
			progressMap.set(cd.participant_id, cd.activity_completed ?? false);
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
	 * @param {number} participant_id - Participant ID to set completion for
	 * @returns {Promise<ActivityCompletion>} Promise that resolves when completion is set
	 */
	async setCompletion(completed: boolean, participant_id: number, sendMessage: boolean = true): Promise<ActivityCompletion>{
		const now = new Date();
		let message = {
			type: "activity_completed",
			activity_type: this.activity_type,
			activity_id: this.activity_id,
			session_id: this.session_id,
			simlet_id: this.simlet_id,
			participant_id: participant_id,
			username: this.allocated_username ?? this.current_user_username,
			status: completed,
			timestamp: now.toISOString()
		}
		if (sendMessage) {
			await kafkaEventClient.sendMessage(JSON.stringify(message));
		}		
		let data = await this.getCurrentCompletionData("activity_completed", [participant_id]);
		if (data.length === 0) {
			// Create completion record if it doesn't exist
			const newCompletion = await ActivityCompletion.create(this.activity_id, participant_id);
			const completionUpdate: Partial<ActivityCompletion> = {
				activity_completed: completed,
				activity_completion_date: completed ? now : null,
				activity_initialization_date: now
			};
			await newCompletion.update(completionUpdate);
			newCompletion.activity_completed = completed;
			newCompletion.activity_completion_date = completed ? now : null;
			newCompletion.activity_initialization_date = now;
			return newCompletion;
		}
		for (const cd of data) {
			const completionUpdate: Partial<ActivityCompletion> = {
				activity_completed: completed,
				activity_completion_date: completed ? now : null,
				activity_initialization_date: cd.activity_initialization_date ?? now
			};
			await cd.update(completionUpdate);
			cd.activity_completed = completed; // Update local instance to reflect change
			cd.activity_completion_date = completed ? now : null;
			if (!cd.activity_initialization_date) {
				cd.activity_initialization_date = now;
			}
		}
		return data[0];
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
		let participants_id = await this.getAllCurrentParticipantsId();
		let completionData : ActivityCompletion[]= [];
		for (const participant_id of participants_id) {
			let data = await this.setCompletion(status, participant_id, true);
			completionData.push(data);
		}	
		return completionData;
	}

	/**
	 * Sets suspension status for a specific participant.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @async
	 * @method setSuspension
	 * @param {boolean} status - Suspension status to set
	 * @param {number} participant_id - Participant ID to set suspension for
	 * @returns {Promise<ActivityCompletion>} Promise that resolves when suspension status is set
	 */
	async setSuspension(status : boolean, participant_id: number): Promise<ActivityCompletion> {
		let completionData = await this.getCurrentCompletionData("activity_suspended", [participant_id]);
		if (completionData.length === 0) {
			// Create completion record if it doesn't exist
			const newCompletion = await ActivityCompletion.create(this.activity_id, participant_id);
			await newCompletion.update({ activity_suspended: status });
			newCompletion.activity_suspended = status;
			return newCompletion;
		}
		for (const cd of completionData) {
			await cd.update({ activity_suspended: status });
			cd.activity_suspended = status; // Update local instance to reflect change
		}
		return completionData[0];
	}

	async getSuspension(participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
		let suspensionData= await this.getCurrentCompletionData("activity_suspended", participants_id);
		let suspensionMap = new Map<number, boolean>();
		for (const cd of suspensionData) {
			suspensionMap.set(cd.participant_id, cd.activity_suspended ?? false);
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
			if(this.allocated_activity_result?.activity_completed && !this.activity_can_be_restarted) {
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
					if(!previousActivity.allocated_activity_result?.activity_completed && !previousActivity.activity_can_be_restarted) {
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
			await ActivityToClass(activity.activity_id, true, false, activity, allocated_user_id)
	));
	}

	async processStatementsForActivity(current_user_id: number, statements: any): Promise<void> {
		let objectDefinitionType = undefined;
		switch(this.activity_type) {
			case "limesurvey":
				objectDefinitionType = "http://adlnet.gov/expapi/activities/assessment";
				break;
			case "gameplay":
				objectDefinitionType = "https://w3id.org/xapi/seriousgames/activity-types/serious-game";
				break;
			case "manual":
				logger.info("Processing manual activity for LRS statements");
				//objectDefinitionType = "http://adlnet.gov/expapi/activities/manual-activity";
				break;
			default:
				logger.warn(`Unsupported activity type ${this.activity_type} for xAPI trace processing`);
		}
		for(const statement_id in statements) {
			let trace = statements[statement_id];
			try {	
				if(trace.object && trace.object.definition && trace.object.definition.type == objectDefinitionType) {
					const initializedVerb='http://adlnet.gov/expapi/verbs/initialized';
					const progressedVerb='http://adlnet.gov/expapi/verbs/progressed';
					const completedVerb=this.activity_type == "limesurvey" ? 'http://adlnet.gov/expapi/verbs/terminated' : 'http://adlnet.gov/expapi/verbs/completed';
					const resultExtensionProgress='https://w3id.org/xapi/seriousgames/extensions/progress';
					switch(trace.verb.id) {
						case initializedVerb:
							logger.info(`INITIALIZED ACTIVITY ${this.activity_type}`);
							await this.setInitialized(true, current_user_id, true);
							break;
						case progressedVerb:
							let value= 0;
							logger.info(`PROGRESSED ACTIVITY ${this.activity_type}`);
							switch(this.activity_type) {
								case "limesurvey":
									value = trace.result.score.scaled;
									break;
								case "gameplay":
									value = trace.result.extensions[resultExtensionProgress];
									break;
								default:
									logger.warn(`Unsupported activity type ${this.activity_type} for progress value extraction from xAPI trace`);
							}
							let roundedValue = Number(value.toFixed(6));
							logger.info(`Progress value from trace: ${value}`);
							await this.setProgress(roundedValue, current_user_id, true);
							break;
						case completedVerb:
							logger.info(`COMPLETED ACTIVITY ${this.activity_type}`);
							if(trace.result && trace.result.completion && Boolean(trace.result.completion)) {
								await this.setCompletion(true, current_user_id, true);
							}
							break;
						default:
							logger.info(`OTHER VERB ${trace.verb.id} for ACTIVITY ${this.activity_type}, no state change applied`);
					}
				}
			} catch (error) {
				logger.error({error, trace}, `Error processing statement ${statement_id} for activity ${this.activity_id}:`);
			}
		}
	}

	async sendStatementsLRSForActivity(current_user_id: number, statements: any): Promise<number[]> {
		let ids = await lrsclient.setStatement(statements, this.activity_id, (await User.getFromDbData(current_user_id)).username);
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
	async hasResults(type: string, participants_id?: number[]): Promise<ActivityMappingResult<boolean>>{
		return new ActivityMappingResult(new Map<number, boolean>());
	}

	async getResults(type: string, participants_id?: number[]): Promise<ActivityMappingResult<string|null>> {
		return new ActivityMappingResult(new Map<number, string|null>());
	}

	/**
	 * Sets a result for a participant in this activity.
	 * Stub implementation - to be implemented by subclasses.
	 * 
	 * @method setResult
	 * @param {any} result - Result value to set
	 * @param {number} participant_id -  Participant ID to set result for
	 * @returns {void}
	 */
	async setResult(type: string, result: any, participant_id: number): Promise<void> {
		switch(type) {
			case 'results':
				await minioClient.putFile(`${config.minio.backupDir}/${this.activity_id}/${participant_id}.result`, result);
				break;
			case 'traces':
				await this.processStatementsForActivity(participant_id, result);
				await this.sendStatementsLRSForActivity(participant_id, result);
				break;
			default:
				throw new BadRequestError(`Unsupported result type: ${type}`);
		}
	}

	/**
	 * Generates a presigned URL for file access.
	 * Currently commented out - stub implementation for future MinIO integration.
	 * 
	 * @async
	 * @method generatePresignedFileUrl
	 * @returns {Promise<string>} Promise that resolves to the generated presigned URL
	 */
	async generatePresignedFileUrl(): Promise<string> {
		let path = `${config.minio.outputsDir}/${this.activity_id}/${config.minio.tracesFile}`;
		logger.info(path);
		if(this.activity_presignedUrl && this.activity_presignedUrl_expired_at) {
			let expirationDate = this.activity_presignedUrl_expired_at;
			if (expirationDate > new Date()) {
				logger.info("Presigned URL is still valid, returning existing URL");
				return this.activity_presignedUrl!;
			}
		}
		if (await minioClient.fileExists(path)) {
			let presignedUrl = null;
			presignedUrl = await minioClient.getPresignedUrl(path, config.minio.presigned_url_expiration_time_in_second);
			await this.patch({ activity_presignedUrl: presignedUrl, activity_presignedUrl_generated_at: new Date(), activity_presignedUrl_expired_at: new Date(Date.now() + config.minio.presigned_url_expiration_time_in_second * 1000) });
			return presignedUrl;
		} else {
			throw new NotFoundError(`Error the file ${path} don't exist in minio`);
		}
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
			activity_presignedUrl_generated_at: this.activity_presignedUrl_generated_at,
			activity_presignedUrl_expired_at: this.activity_presignedUrl_expired_at,
			activity_comply_with_GDPR: this.activity_comply_with_GDPR
		};
		if(this.allocated_user) {
			 return {
				...obj,
				session_active: this.session_active,
				allocated_user_id: this.allocated_user_id,
				allocated_username: this.allocated_username,
				allocated_isToken: this.allocated_isToken,
				allocated_token: this.allocated_token
			};
		} else {
			return {
				...obj
			};
		}
	}
}