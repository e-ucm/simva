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

	generateStatementId(trace: any): string {
		var traceid;
		if(trace.id == null) {
			traceid = uuidv4();
		} else {
			traceid = trace.id;
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

	getSimletType() {
		return `${config.externalUrl}/about#simlet`;
	}

	getSessionType() {
		return `${config.externalUrl}/about#session`;
	}

	getActivityType() {
		return `${config.externalUrl}/about#activity`;
	}

	updateMissingTraceElements(trace : any, participant: string, simletId: number, sessionId: number, activityId?: number, useTestUrls: boolean = false): any {
		let updatedStatement = trace;
		logger.info('Updating missing trace elements');
        const now = new Date();
        const simvaUrl = config.externalUrl;
        const authorityName = participant || 'lrs-manager';
        const simletType = this.getSimletType();
        const sessionType = this.getSessionType();
        const activityType = this.getActivityType();
        updatedStatement=updatedStatement.withId(this.generateStatementId(trace));
        if(!trace.version) {
            updatedStatement=updatedStatement.withVersion("1.0.3");
        }
		updatedStatement=updatedStatement.withPlatform(simvaUrl);
		updatedStatement=updatedStatement.withAutorityAccount(authorityName, simvaUrl);
		updatedStatement=updatedStatement.withStored(now);
		if(activityId) {
			updatedStatement=updatedStatement.withContextActivity(
				this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.PARENT,
				this.getStandaloneActivityUrl(activityId, useTestUrls),
				activityType
			)
			.withContextActivity(
				this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.GROUPING,
				this.getActivityUrl(simletId, sessionId, activityId, useTestUrls),
				activityType
			);
		} else {
			updatedStatement=updatedStatement.withContextActivity(
				this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.PARENT,
				this.getSimletUrl(simletId, useTestUrls),
				simletType
			)	
		}
		updatedStatement=updatedStatement.withContextActivity(
				this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.GROUPING,
				this.getSessionUrl(simletId, sessionId, useTestUrls),
				sessionType
			)
			.withContextActivity(
				this.lrs.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.GROUPING,
				this.getSimletUrl(simletId, useTestUrls),
				simletType
			);
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