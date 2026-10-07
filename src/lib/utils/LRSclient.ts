import { v4 as uuidv4 } from 'uuid';
import BloomFilters from 'bloom-filters';
import * as fs from 'fs';
import * as path from 'path';
import { config } from "@/lib/config";
import { logger } from '../logger';
import { kafkaClient } from './kafkaclient';
import { JSScormTracker, LRSTracker } from 'js-tracker';
import { LRSError } from '../errors/appErrors';

const { ScalableBloomFilter } = BloomFilters;

/**
 * Learning Record Store (LRS) Activity mapper class extending base Activity.
 * Handles activities that integrate with LRS systems for xAPI data storage and processing.
 * 
 * @class LRSClient
 * @description Manages LRS integration including Minio storage and Kafka streaming
 * for learning analytics and experience data collection.
 */
export class LRSClient {
	// ##########################################
	// Constructor and basic set of functions
	// ##########################################
	filter: InstanceType<typeof ScalableBloomFilter>;
	readonly #backupPath: string;
	lrs!: LRSTracker;
	jsScormTracker!: JSScormTracker;

	/**
	 * Creates a new LRSClient instance
	 * 
	 * @param {string} [backupPath] - Optional custom path for bloom filter backup file
	 * @description Initializes LRS client properties for LRS integration.
	 * Attempts to load existing bloom filter from backup file at startup.
	 */
	constructor(backupPath?: string) {
		this.#backupPath = backupPath ?? path.join(config.bloomFilterBackupPath, config.bloomFilterBackupFile);
		this.filter = this.loadFromFile() ?? new ScalableBloomFilter();
	}

	isEnabled(): boolean {
		return config.lrs.enabled;
	}

	checkLRSEnable(): boolean {
		return (config.lrs.enabled && (!this.lrs || (this.lrs && !this.lrs?.tracker?.online)));
	}

	async initJSScormTracker() {
		if(!this.jsScormTracker) {
			const jsScormTracker = new JSScormTracker();
			jsScormTracker.trackerSettings.debug = true;
			jsScormTracker.trackerSettings.platform = config.externalUrl;
			this.jsScormTracker = jsScormTracker;
		}
		if(this.lrs && this.lrs.tracker?.online) {
			logger.info('LRS client already initialized and online');
			return;
		}
		const lrs = new LRSTracker();
		lrs.trackerSettings.debug = true;
		logger.info(config.lrs, 'Initializing JS SCORM Tracker with LRS settings');
		const lrsEndpoint = (config.lrs.endpoint || '').replace(/\/+$/, '');
		const lrsUsername = config.lrs.apiKeyDefault;
		const lrsPassword = config.lrs.apiSecretDefault;

		if (!lrsEndpoint || !lrsUsername || !lrsPassword) {
			throw new Error('Invalid LRS configuration: endpoint, api key and api secret are required.');
		}

		lrs.trackerSettings.batch_endpoint = `${lrsEndpoint}/xapi`;
		lrs.trackerSettings.oauth_type = "OAuth1";
		logger.info(lrs.trackerSettings, 'JS SCORM Tracker settings configured');
		lrs.oauth1.username = lrsUsername;
		lrs.oauth1.password = lrsPassword;
		logger.info(lrs.oauth1, 'JS SCORM Tracker OAuth settings configured');
		await lrs.login(); // Authenticate with the LRS before sending any statements
		lrs.start(); // Initialize the tracker before using it
		this.lrs = lrs; // Only assign after successful initialization
		logger.info('JS SCORM Tracker initialized and authenticated with LRS');
		///this.jsScormTracker.trackerSettings.batch_endpoint = `${lrsEndpoint}/xapi`;
		//
		///this.jsScormTracker.trackerSettings.oauth_type = "OAuth1";
		///this.jsScormTracker.oauth1.username = lrsUsername;
		///this.jsScormTracker.oauth1.password = lrsPassword;
		//await this.jsScormTracker.login();
		logger.info('JS SCORM Tracker initialized and authenticated with LRS');
	}

	/**
	 * Loads bloom filter from backup file
	 * @returns {InstanceType<typeof ScalableBloomFilter> | null} Loaded filter or null if not found/invalid
	 */
	private loadFromFile(): InstanceType<typeof ScalableBloomFilter> | null {
		try {
			if (fs.existsSync(this.#backupPath)) {
				const data = fs.readFileSync(this.#backupPath, 'utf-8');
				const json = JSON.parse(data);
				logger.info({ path: this.#backupPath }, 'Bloom filter loaded from backup');
				return ScalableBloomFilter.fromJSON(json);
			}
		} catch (err) {
			logger.warn({ err, path: this.#backupPath }, 'Failed to load bloom filter from backup, starting fresh');
		}
		return null;
	}

	/**
	 * Saves bloom filter to backup file
	 */
	saveToFile(): void {
		try {
			const dir = path.dirname(this.#backupPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			const data = JSON.stringify(this.exportFilter());
			fs.writeFileSync(this.#backupPath, data, 'utf-8');
			logger.debug({ path: this.#backupPath }, 'Bloom filter saved to backup');
		} catch (err) {
			logger.error({ err, path: this.#backupPath }, 'Failed to save bloom filter to backup');
		}
	}

	/**
	 * Exports the bloom filter state as JSON
	 * @returns {object} JSON representation of the filter
	 */
	exportFilter(): object {
		return this.filter.saveAsJSON();
	}

	/**
	 * Imports a bloom filter from JSON data
	 * @param {any} data - JSON data from a previous export
	 */
	importFilter(data: any): void {
		this.filter = ScalableBloomFilter.fromJSON(data);
	}

	/**
	 * Generates the id of a statement, keeping the one it already has when it is not a duplicate.
	 *
	 * The id may live on the statement itself or on the builder that wraps it, depending on whether
	 * the caller received a plain statement or a builder, so both are read.
	 *
	 * @method generateStatementId
	 * @param {any} trace - statement or statement builder
	 * @returns {string} an id that has not been sent yet
	 */
	generateStatementId(trace: any): string {
		const currentId = trace?.statement?.id ?? trace?.id;
		var traceid;
		if(currentId == null) {
			traceid = uuidv4();
		} else {
			traceid = currentId;
		}
		while(this.filter.has(traceid)) {
			traceid = uuidv4();
		}
		this.filter.add(traceid);
		return traceid;
	}

	/**
	 * Registers shutdown handlers to save filter on process exit
	 */
	registerShutdownHandler(): void {
		process.on('beforeExit', async () => {
			await this.lrs.flush();
			this.saveToFile();
			logger.debug('LRS client state saved');
		});
	}

	getActivityUrl(simletId: number, sessionId: number, activityId: number, useTestUrls: boolean = false): string {
		const prefix = useTestUrls ? "/test" : "";
		return `${config.externalUrl}${prefix}/simlets/${simletId}/sessions/${sessionId}/activities/${activityId}`;
	}

	getSessionUrl(simletId: number, sessionId: number, useTestUrls: boolean = false): string {
		const prefix = useTestUrls ? "/test" : "";
		return `${config.externalUrl}${prefix}/simlets/${simletId}/sessions/${sessionId}`;
	}

	getSimletUrl(simletId: number, useTestUrls: boolean = false): string {
		const prefix = useTestUrls ? "/test" : "";
		return `${config.externalUrl}${prefix}/simlets/${simletId}`;
	}

	getStandaloneActivityUrl(activityId: number, useTestUrls: boolean = false): string {
		const prefix = useTestUrls ? "/test" : "";
		return `${config.externalUrl}${prefix}/activities/${activityId}`;
	}

	getAdminUrl() {
		return `${config.externalUrl}/admin`;
	}

	getSimletType() {
		return `${config.externalUrl}/about#simlet`;
	}

	getSessionType() {
		return `${config.externalUrl}/about#session`;
	}

	getActivityType() {
		return `${config.externalUrl}/about#activity`;
	}
	
	getAdminType() {
		return `${config.externalUrl}/about`;
	}

	/**
	 * Normalizes the agent filter of a statements query before sending it to the LRS.
	 *
	 * The LRS client serializes the value of the agent parameter with JSON.stringify, so it has to be
	 * received as an object (query parameters always arrive as strings, which would be serialized twice
	 * and rejected by the LRS). The LRS also only understands the agent name of xAPI 2.0, while actor is
	 * the xAPI 1.0.3 one, so it is renamed here.
	 *
	 * @method normalizeStatementsQuery
	 * @param {any} query - query of the statements to normalize (it is modified in place)
	 * @returns {any} the same query, with the agent filter as an object
	 */
	normalizeStatementsQuery(query: any): any {
		if(!query || typeof query !== 'object') {
			return query;
		}
		// The filter may come with the xAPI 2.0 name (agent) or with the xAPI 1.0.3 one (actor)
		const agent = query.agent ?? query.actor;
		delete query.actor;
		if(agent === undefined || agent === null || agent === '') {
			delete query.agent;
			return query;
		}
		if(typeof agent === 'string') {
			try {
				query.agent = JSON.parse(agent);
			} catch(err) {
				logger.warn({ agent, err }, "Discarding invalid agent filter of the statements query");
				delete query.agent;
			}
		} else {
			query.agent = agent;
		}
		return query;
	}

	/**
	 * Normalizes the context activities of a statement.
	 *
	 * The xAPI specification defines contextActivities as an object whose keys are the relations
	 * (parent, grouping, category) and whose values are arrays of activities. Clients send it
	 * unvalidated, and an array is silently destructive: adding a relation to it attaches a string
	 * key to the array, which every serialization drops, so the activities added here would be lost.
	 * A single object is accepted by xAPI 2.0 where 1.0.3 requires an array, so it is wrapped rather
	 * than rejected.
	 *
	 * A relation may hold Activity Objects or, for grouping, category and other, plain IRIs, so
	 * IRIs are kept for those relations while parent, which only accepts Activity Objects, and any
	 * value that cannot be an activity are discarded.
	 *
	 * js-tracker normalizes this too, but simva pins a js-tracker release that may predate that fix,
	 * so the statement is normalized here as well.
	 *
	 * @method normalizeContextActivities
	 * @param {any} input - contextActivities of the incoming statement
	 * @returns {Object} an object whose keys are relations and whose values are arrays of activities
	 */
	normalizeContextActivities(input: any): Record<string, any[]> {
		if(!input || typeof input !== 'object' || Array.isArray(input)) {
			return {};
		}
		const normalized: Record<string, any[]> = {};
		for(const [relation, activities] of Object.entries(input as Record<string, any>)) {
			const list = Array.isArray(activities) ? activities : [activities];
			const kept = list.filter((activity: any) => {
				if(!activity) {
					return false;
				}
				if(typeof activity === 'object') {
					return true;
				}
				if(typeof activity !== 'string' || !LRSClient.isIri(activity)) {
					return false;
				}
				return relation !== 'parent';
			});
			if(kept.length > 0) {
				normalized[relation] = kept;
			}
		}
		return normalized;
	}

	/**
	 * Checks whether a value is an absolute IRI
	 * @method isIri
	 * @param {string} value - value to check
	 * @returns {boolean} whether the value is an absolute IRI
	 */
	static isIri(value: string): boolean {
		return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/[^\s/$.?#].[^\s]*$/.test(value);
	}

	/**
	 * Adds a context activity to a statement, unless that relation already holds that activity.
	 *
	 * The activity is identified by its id. A client may send a relative id, which never matches the
	 * absolute id added here, so such a relation ends up holding both; that is preferred over
	 * dropping an activity the client did send.
	 *
	 * @method addMissingContextActivity
	 * @param {any} statement - statement builder to add the activity to
	 * @param {string} relation - relation of the activity (parent, grouping, category)
	 * @param {string} id - absolute id of the activity
	 * @param {string} activityType - type of the activity
	 * @returns {any} the same statement builder
	 */
	addMissingContextActivity(statement: any, relation: string, id: string, activityType: string): any {
		const contextActivities = statement?.statement?.context?.contextActivities;
		const current = Array.isArray(contextActivities?.[relation]) ? contextActivities[relation] : [];
		const alreadyPresent = current.some((activity: any) => !!activity && (activity.id ?? activity) === id);
		if(!alreadyPresent) {
			statement.withContextActivity(relation, id, activityType);
		}
		return statement;
	}

	/**
	 * Fills in the trace elements a statement does not carry: id, version, platform, authority,
	 * stored date and the context activities that describe its place in the platform.
	 *
	 * @method updateMissingTraceElements
	 * @param {any} trace - statement builder to complete
	 * @param {string} [participant] - username that performed the action
	 * @param {number} [simletId] - id of the SIMLET
	 * @param {number} [sessionId] - id of the session
	 * @param {number} [activityId] - id of the activity
	 * @param {boolean} [useTestUrls] - whether to build the urls for the test environment
	 * @returns {any} the completed statement builder
	 */
	updateMissingTraceElements(trace : any, participant?: string, simletId?: number, sessionId?: number, activityId?: number, useTestUrls: boolean = false): any {
		let updatedStatement = trace;
		logger.info('Updating missing trace elements');
        const now = new Date();
        const simvaUrl = config.externalUrl;
        const authorityName = participant != undefined ? participant : 'mylrsmanager';
        const simletType = this.getSimletType();
        const sessionType = this.getSessionType();
        const activityType = this.getActivityType();

		// the id and the version live on the statement, not on the builder, so reading them from the
		// builder always reported them as missing and replaced the ones the client already sent
		const statement = updatedStatement?.statement;
		if(!statement) {
			logger.warn({ trace }, 'Cannot complete a trace without a statement');
			return updatedStatement;
		}
		if(statement.context) {
			// js-tracker always builds a context, but it may carry no contextActivities at all, in
			// which case they have to be created before any relation can be added to them
			const incoming = statement.context.contextActivities;
			statement.context.contextActivities = this.normalizeContextActivities(incoming);
			if(Array.isArray(incoming)) {
				logger.warn({ id: statement.id }, 'Discarding malformed contextActivities of the statement');
			}
		}

        updatedStatement=updatedStatement.withId(this.generateStatementId(statement));
        if(!statement.version) {
            updatedStatement=updatedStatement.withVersion("1.0.3");
        }
		updatedStatement=updatedStatement.withPlatform(simvaUrl);
		updatedStatement=updatedStatement.withAutorityAccount(authorityName, simvaUrl);
		updatedStatement=updatedStatement.withStored(now);
		if(simletId && sessionId) {
			if(activityId) {
				updatedStatement=this.addMissingContextActivity(updatedStatement,
					this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.PARENT,
					this.getStandaloneActivityUrl(activityId, useTestUrls),
					activityType
				);
				updatedStatement=this.addMissingContextActivity(updatedStatement,
					this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.GROUPING,
					this.getActivityUrl(simletId, sessionId, activityId, useTestUrls),
					activityType
				);
			} else {
				updatedStatement=this.addMissingContextActivity(updatedStatement,
					this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.PARENT,
					this.getSimletUrl(simletId, useTestUrls),
					simletType
				);
			}
			updatedStatement=this.addMissingContextActivity(updatedStatement,
				this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.GROUPING,
				this.getSessionUrl(simletId, sessionId, useTestUrls),
				sessionType
			);
			updatedStatement=this.addMissingContextActivity(updatedStatement,
				this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.GROUPING,
				this.getSimletUrl(simletId, useTestUrls),
				simletType
			);
		} else {
			const adminType = this.getAdminType();
			updatedStatement=this.addMissingContextActivity(updatedStatement,
				this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.PARENT,
				this.getAdminUrl(),
				adminType
			);
			updatedStatement=this.addMissingContextActivity(updatedStatement,
				this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.GROUPING,
				this.getAdminUrl(),
				adminType
			);
		}
        return updatedStatement;
    }
	
	async getLRSClient(): Promise<LRSTracker> {
		if (this.checkLRSEnable()) {
			await this.initJSScormTracker();
		}
		return this.lrs;
	}

	async sendTracesToKafka(traces: any[], activityId?: number): Promise<number[]> {
		let payloads = [];
		let responses = [];
		for (var i = traces.length - 1; i >= 0; i--) {
			let trace = traces[i].toXAPI();
			responses.push(trace.id);
			payloads.push(JSON.stringify(trace));
		}
		if(activityId) {
			await kafkaClient.sendMessages(payloads, 0, JSON.stringify({ _id: activityId }));
		}
		return responses;
	}
	
	async sendTracesToLRS(traces: any[]): Promise<number[]> {
		let ids: number[] = [];
		for (var i = traces.length - 1; i >= 0; i--) {
			let traceBuilder = traces[i];
			logger.info('Sending trace to LRS');
			await traceBuilder
				.send();
			ids.push(traceBuilder.statement?.id);
		}
		return ids;
	}
	
	async flushLRS(): Promise<void> {
		if (this.lrs) {
			try {
				await this.lrs.flush();
			} catch (err: any) {
				logger.error({ err }, 'LRS flush failed');
				throw new LRSError('Failed to flush statements to LRS', err);
			}
		} else {
			logger.warn('LRS client not initialized, cannot flush');
		}
	}

	async sendStatements(statement: any): Promise<number[]> {
		if (this.checkLRSEnable()) {
			await this.initJSScormTracker();
		}
		if(!this.lrs) {
			throw new LRSError('LRS client is not initialized', {});
		}
		const traces: any[] = [];
		// updateMissingTraceElements completes whatever the statement lacks, so it must run even when
		// the statement already has an id. Skipping it whenever the client sent one left the statement
		// without its context activities, which is what describes its place in the platform.
		if(Array.isArray(statement)){
			for(const trace of statement) {
				const traceBuilder: any = this.updateMissingTraceElements(this.lrs.fromXAPI(trace));
				traces.push(traceBuilder);
			}
		} else if(statement && typeof statement === 'object'){
			const traceBuilder: any = this.updateMissingTraceElements(this.lrs.fromXAPI(statement));
			traces.push(traceBuilder);
		} else {
			logger.info('Unknown case');
			throw { message: 'Unknown case setting the statements' };
		}
		if(config.lrs.enabled) {
			const ids = await this.sendTracesToLRS(traces);
			await this.flushLRS();
			return ids;
		}
		return [];
	}

	async setStatement(statement: any, participant: string, simletId: number, sessionId: number, activityId?: number, useTestUrls: boolean = false): Promise<number[]> {
		if (this.checkLRSEnable()) {
			await this.initJSScormTracker();
		}
		let toret: number[] = [];
        if(Array.isArray(statement)){
            const traces: any[] = [];
            for(let traceId = 0; traceId < statement.length; traceId++) {
				const traceBuilder = this.lrs.fromXAPI(statement[traceId]);
                traces.push(this.updateMissingTraceElements(traceBuilder, participant, simletId, sessionId, activityId, useTestUrls));
            }
			let response: number[] = [];
			if(!useTestUrls) {
				response = await this.sendTracesToKafka(traces, activityId);
			}
			if(config.lrs.enabled) {
            	 response = await this.sendTracesToLRS(traces);
				 await this.flushLRS();
			}
            toret = response;
        } else if(statement && typeof statement === 'object'){
			const traceBuilder = this.lrs.fromXAPI(statement);
            const trace = this.updateMissingTraceElements(traceBuilder, participant, simletId, sessionId, activityId, useTestUrls);
            let response: number[] = [];
			if(!useTestUrls) {
				response = await this.sendTracesToKafka([trace], activityId);
			}
			if(config.lrs.enabled) {
            	 response = await this.sendTracesToLRS([trace]);
				 await this.flushLRS();
			}
            toret = response;
        } else {
            logger.info('Unknown case');
            throw { message: 'Unknown case setting the statements' };
        }
        return toret;
	}
}

export const lrsclient = new LRSClient();
lrsclient.registerShutdownHandler();
export default LRSClient;