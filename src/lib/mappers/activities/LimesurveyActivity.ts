import { Activity } from "@/lib/mappers/activities/Activity";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { limeSurveyClient, Survey, SurveyLanguages } from "@/lib/utils/limesurveyclient";
import { ActivityCompletion } from "@/lib/mappers/ActivityCompletion/ActivityCompletion";
import { ActivityMappingResult } from "../ActivityCompletion/ActivityMappingResult";
import { User } from "../Users/User";
import { minioClient } from "@/lib/utils/minioclient";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * LimeSurvey Activity mapper class extending base Activity.
 * Represents activities that integrate with LimeSurvey platform for surveys and questionnaires.
 * 
 * @class LimesurveyActivity
 * @extends Activity
 * @description Handles LimeSurvey-specific properties and provides survey management functionality.
 * Integrates with LimeSurvey API for survey deployment and data collection.
 */
export class LimesurveyActivity extends Activity {
	/**
	 * ID of the survey in LimeSurvey system
	 * @default -1
	 */
	survey_id: number=-1;
	
	/**
	 * Language code for the survey (e.g., 'en', 'es')
	 * @default ''
	 */
	survey_language: string='';
	
	survey_languages: SurveyLanguages = { default: '', list: [] };

	/**
	 * Learning Record Store (LRS) set identifier for xAPI data
	 * @default -1
	 */
	survey_lrsset: number=-1;
	
	/**
	 * Creates a new LimesurveyActivity instance
	 * 
	 * @param {any} data - Raw data object containing activity and LimeSurvey-specific properties
	 * @description Initializes base activity properties and LimeSurvey-specific fields.
	 * Uses nullish coalescing for safe default value assignment.
	 */
	constructor(allocated:boolean, data: any) {
		super(allocated, data);
		// Assign limesurvey-specific properties if provided in data
		this.survey_id = data.survey_id ?? -1;
		this.survey_language = data.survey_language ?? '';
		this.survey_lrsset = data.survey_lrsset ?? -1;
	}
	
	/**
	 * Creates a LimesurveyActivity instance with database-loaded data
	 * 
	 * @static
	 * @async
	 * @param {any} activityData - Raw activity data object
	 * @returns {Promise<LimesurveyActivity>} Fully initialized LimesurveyActivity instance
	 * @description Factory method that creates instance and loads additional data from database.
	 * Handles database errors gracefully and ensures proper initialization.
	 */
	static async getFromDbData(activity_id: number, allocated: boolean, is_admin: boolean, activityData: any, user_id?: number): Promise<LimesurveyActivity> {
		const instance = new LimesurveyActivity(allocated, activityData);
		
		let limesurveyData = await db.Tables.LimesurveyActivities.findOne({ 
			where: { activity_id: activity_id } 
		});
		let found = !!limesurveyData;
		logger.debug(`LimesurveyActivity.getFromDbData: Found LimeSurvey data for activity_id ${activity_id}: ${found}`);
		if (!limesurveyData) {
			if(activityData.rawsurvey) {
				activityData.survey_id = await limeSurveyClient.createSurvey(activityData.rawsurvey);
			} else if(activityData.copysurvey) {
				activityData.survey_id = await limeSurveyClient.cloneSurvey(activityData.copysurvey, activityData.activity_name || `Copy of survey ${activityData.copysurvey}`);
			} else {
				throw new NotFoundError("No survey data provided for new LimesurveyActivity");
			}
			//TODO handle copy of survey and update survey_id in activityData before creating LimesurveyActivity entry in database
			instance.survey_languages = await limeSurveyClient.getSurveyLanguages(activityData.survey_id);
			limesurveyData = await db.Tables.LimesurveyActivities.create({
				activity_id: activity_id,
				survey_id: activityData.survey_id,
				survey_language: instance.survey_languages.default,
				survey_lrsset: null
			});
		}
		instance.survey_id = limesurveyData.survey_id ?? -1;
		instance.survey_language = limesurveyData.survey_language ?? '';
		instance.survey_lrsset = limesurveyData.survey_lrsset ?? -1;
		if(found) {
			instance.survey_languages = await limeSurveyClient.getSurveyLanguages(instance.survey_id);
		}
		
		return instance;
	}
	
	static getType(){
		return 'limesurvey';
	}

	static getName(){
		return 'LimeSurvey Activity';
	}
	
	static getDescription() : string {
		return 'An activity integrated with LimeSurvey for surveys and questionnaires.';
	}

	static async getUtils(): Promise<object> {
		let utils = await super.getUtils() as any;
		let isOnline = await limeSurveyClient.isOnline();
		utils = { ...utils, url: config.limesurvey.url, isOnline };
		if(config.limesurvey.useNewVersion) {
			utils.editurl= config.limesurvey.external_url + "/surveyAdministration/view?surveyid={{surveyId}}" ;
			utils.newurl= config.limesurvey.external_url + "/surveyAdministration/newSurvey" ;
		} else {
			utils.editurl= config.limesurvey.external_url + "/admin/survey/sa/view/surveyid/{{surveyId}}" ;
			utils.newurl= config.limesurvey.external_url + "/admin/survey/sa/newsurvey" ;
		}
		return utils;
	}

	async addParticipants(participants_id: number[]): Promise<ActivityCompletion[]> {
		const resolvedParticipantIds = await this.getAllCurrentParticipantsId(participants_id);
		const usernamesMap = await this.getAllCurrentParticipantsUsername(resolvedParticipantIds);
		await limeSurveyClient.addParticipants(this.survey_id, Array.from(usernamesMap.values()));
		return super.addParticipants(resolvedParticipantIds);
	}

	async activate(activate: boolean, status?: string): Promise<void> {
		await super.activate(activate);
		if(activate) {
			try {
				await limeSurveyClient.activateSurvey(this.survey_id);
			} catch (error) {
				logger.info({ error }, `Error activating survey with ID ${this.survey_id}`);
			}
			try {
				await limeSurveyClient.activateTokens(this.survey_id);
			} catch (error) {
				logger.info({ error }, `Error activating survey tokens with ID ${this.survey_id}`);
			}
			await limeSurveyClient.setActivityLRSEndpoint(this.survey_id, `${config.api.url}/activities/${this.activity_id}/lrs`);
		} else {
			await limeSurveyClient.setActivityLRSEndpoint(this.survey_id, "");	
		}
		await limeSurveyClient.setActiveSurvey(this.survey_id, activate);
		await this.addParticipants(await this.getAllCurrentParticipantsId());
	}

	async removeParticipants(participants_id: number[]): Promise<void> {
		await super.removeParticipants(participants_id);
		logger.debug(`Removing participants with IDs ${participants_id} from activity with ID ${this.activity_id}`);
		if(participants_id.length > 0 && participants_id.includes(this.current_user_id!)) {
			logger.debug(`Corresponding usernames to remove from survey with ID ${this.survey_id}: ${this.current_user_username!}`);
			try {
				await limeSurveyClient.deleteParticipantAndResponseByToken(this.survey_id, this.current_user_username!);
			} catch (error) {
				logger.info({ error }, `Error deleting participant with token ${this.current_user_username!} from survey with ID ${this.survey_id}`);
			}
		}
	}

	static async getSurveys(): Promise<Survey[]> {
		return await limeSurveyClient.getSurveyList();
	}

	async getSurveyLanguages(): Promise<SurveyLanguages> {
		return await limeSurveyClient.getSurveyLanguages(this.survey_id);
	}

	canBeOpened(): boolean {
		return true;
	}

	async patch(data : any): Promise<void> {
		await super.patch(data);
		// Map frontend field names to database field names
		const mappedData: any = {};
		if (data.survey_language !== undefined) {
			mappedData.survey_language = data.survey_language;
		}
		if (data.copysurvey !== undefined) {
			try {
				const newSurveyId = await limeSurveyClient.cloneSurvey(data.copysurvey, data.activity_name || `Copy of survey ${data.copysurvey}`);
				mappedData.survey_id = newSurveyId;
				mappedData.survey_language = (await limeSurveyClient.getSurveyLanguages(newSurveyId)).default;
			} catch (error) {
				logger.error(error, `Error cloning survey with ID ${data.copysurvey}`);
			}
		}
		if (Object.keys(mappedData).length > 0) {
			let activity = await db.Tables.LimesurveyActivities.findOne({ where: { activity_id: this.activity_id } });
			if (activity) {
				await activity.update(mappedData);
			}
		}
	}

	async getAllCurrentParticipantsId(participants_id?: number[]): Promise<number[]> {
		const currentParticipantIds = await super.getAllCurrentParticipantsId(participants_id);
		if (currentParticipantIds.length > 0 || this.allocated_user) {
			return currentParticipantIds;
		}

		const allocatedParticipants = await db.Tables.ExperimentalParticipants.findAll({
			where: { session_id: this.session_id },
			attributes: ['participant_id']
		});
		return allocatedParticipants.map((participant: any) => participant.participant_id);
	}

	async getAllCurrentParticipantsUsername(participants_id?: number[]): Promise<Map<number, string>> {
		return super.getAllCurrentParticipantsUsername(participants_id);
	}

	async target(participants_id?: number[]): Promise<ActivityMappingResult<string>> {
		participants_id = await this.getAllCurrentParticipantsId(participants_id);
		let targetMap = new Map<number, string>();
		const usernames = await this.getAllCurrentParticipantsUsername(participants_id);
		for (let i = 0; i < participants_id.length; i++) {
			targetMap.set(participants_id[i], `${config.limesurvey.external_url}/${this.survey_id}?token=${usernames.get(participants_id[i])}&lang=${this.survey_language}`);
		}
		logger.debug(targetMap.toString());
		return new ActivityMappingResult(targetMap);
	}

	async getInitialized(participants_id?: number[]): Promise<ActivityMappingResult<boolean | null>> {
		return super.getInitialized(participants_id);
	}

	async setInitialized(initialized: boolean, initialized_date: Date, participant_id: number): Promise<ActivityCompletion> {
		return super.setInitialized(initialized, initialized_date, participant_id);
	}

	async getProgress(participants_id?: number[]): Promise<ActivityMappingResult<number | null>> {
		return super.getProgress(participants_id);
	}
	
	async setProgress(progress: number, progress_date: Date, participant_id: number): Promise<ActivityCompletion> {
		return super.setProgress(progress, progress_date, participant_id);
	}

	async getCompletion(participants_id?: number[]): Promise<ActivityMappingResult<boolean | null>> {
		return super.getCompletion(participants_id);
	}

	async setCompletion(completed: boolean, completed_date: Date, participant_id: number): Promise<ActivityCompletion> {
		let usernames = await super.getAllCurrentParticipantsUsername([participant_id]);
		const username = usernames.get(participant_id);
		if(username) {
			let response = await limeSurveyClient.getResponseByToken(this.survey_id, this.survey_language, username, "full");
			if(typeof response !== "boolean") {
				// Ensure response is a string, Buffer, or stream.Readable
				let resultData = response;
				if (response && typeof response !== "string" && !Buffer.isBuffer(response)) {
					resultData = JSON.stringify(response);
				}
				await super.setResult("full", resultData, participant_id);
			}
		}
		return super.setCompletion(completed, completed_date, participant_id);
	}

	async setMultiCompletion(status : boolean): Promise<ActivityCompletion[]> {
		return super.setMultiCompletion(status);
	}

	async setSuspension(status : boolean, participant_id: number, reason?: string): Promise<ActivityCompletion> {
		return super.setSuspension(status, participant_id, reason);
	}

	async getSuspension(participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
		return super.getSuspension(participants_id);
	}

	async sendXAPITraceForActivity(verb: "initialized" | "resumed" | "suspended" | "terminated", completionData: ActivityCompletion, timestamp ?: Date, reasonExtension ?: string, resultScore ?: number, resultSuccess ?: boolean): Promise<void> {
		return super.sendXAPITraceForActivity(verb, completionData, timestamp, reasonExtension, resultScore, resultSuccess);
	}
	
	async generatePresignedFileUrl(): Promise<string> {
		return super.generatePresignedFileUrl();
	}

	async hasResults(type: string, participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
		let pids = await super.getAllCurrentParticipantsId(participants_id);
		logger.info(pids);
		let usernames = await super.getAllCurrentParticipantsUsername(pids);
		let results = await super.hasResults(type, participants_id);
		for (const participant_id of pids ?? []) {
			const username = usernames.get(participant_id);
			const activityResult = await ActivityCompletion.getFromDbData(this.activity_id, participant_id, "activity_completed");
			if(activityResult.activity_completed) {
				continue;
			}
			if (typeof username === "string") {
				let response = await limeSurveyClient.getResponseByToken(this.survey_id, this.survey_language, username, "full");
				logger.info({username, response}, "response for user");
				if(typeof response !== "boolean") {
					// Ensure response is a string, Buffer, or stream.Readable
					let resultData = response;
					if (response && typeof response !== "string" && !Buffer.isBuffer(response)) {
						resultData = JSON.stringify(response, null, "\t");
					}
					await super.setResult("full", resultData, participant_id);
					results.set(participant_id, true);
				} else {
					results.set(participant_id, false);
				}
			}
		}
		logger.info(results);
		return results;
	}

	async getResults(type: string, participants_id?: number[]): Promise<ActivityMappingResult<string | null>> {
		const pids = await super.getAllCurrentParticipantsId(participants_id);
		await this.hasResults(type, pids);
		return await super.getResults(type, pids);
	}

	async getAllResults(type : string) : Promise<string> {
		let usernames: string[] = [];
		const users: Map<number, string> = await super.getAllCurrentParticipantsUsername();
		usernames.push(...users.values());
		let path = `${config.minio.backupDir}/${this.activity_id}/${type}.result`;
		switch(type) {
			case "full":
			case "code":
				let response = await limeSurveyClient.getResponses(this.survey_id, this.survey_language, usernames, "full");
				if(typeof response !== "boolean") {
					// Ensure response is a string, Buffer, or stream.Readable
					let resultData : any = response;
					if (response && typeof response !== "string" && !Buffer.isBuffer(response)) {
						resultData = JSON.stringify(response);
					}
					await minioClient.putFile(path, resultData);
				}
				break;
			default:
				throw new NotFoundError("Not available for this type in Limesurvey");
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

	async remove(): Promise<void> {
		const limesurveyActivity = await db.Tables.LimesurveyActivities.findOne({
			where: { activity_id: this.activity_id }
		});
		if(limesurveyActivity){
			await limesurveyActivity.destroy();
		}
		await super.remove();
	}
	
	/**
	 * Converts the LimesurveyActivity instance to a JSON representation.
	 * Extends the base Activity JSON with LimeSurvey-specific properties.
	 * 
	 * @method toJSON
	 * @returns {object} JSON object containing base activity properties plus LimeSurvey fields
	 * @override
	 */
	toJSON(): object {
		return {
			...super.toJSON(),
			activity_type : LimesurveyActivity.getType(),
			survey_id: this.survey_id,
			survey_language: this.survey_language,
			survey_languages: this.survey_languages,
			survey_lrsset: this.survey_lrsset
		};
	}

	async export(complete: boolean): Promise<object> {
		let activity = this.toJSON() as any;
		try {
			// Await the result of the survey export
			const surveyResult = await limeSurveyClient.exportSurvey(this.survey_id);
			activity.rawsurvey = surveyResult;
			logger.info("LSS Export successful");
		} catch (error) {
			logger.error(error, "LSS Export failed:");
		}
		if(complete) {
			activity.participants = await this.getAllCurrentParticipantsUsername();
			activity.results = await this.getResults("full");
		} else {
			activity.copysurvey = this.survey_id;
		}
		return activity;
	}
}