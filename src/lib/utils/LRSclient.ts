import { v4 as uuidv4 } from 'uuid';
import BloomFilters from 'bloom-filters';
import * as fs from 'fs';
import * as path from 'path';
import { config } from "@/lib/config";
import { logger } from '../logger';
import { kafkaClient } from './kafkaclient';
import { LRSTracker } from 'js-tracker';

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
	jstracker!: LRSTracker;
	flushLRS: boolean = false;

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

	async initJSScormTracker() {
		this.jstracker = new LRSTracker();
		this.jstracker.trackerSettings.debug = true;
		logger.info(config.lrs, 'Initializing JS SCORM Tracker with LRS settings');
		const lrsEndpoint = (config.lrs.endpoint || '').replace(/\/+$/, '');
		const lrsUsername = config.lrs.apiKeyDefault;
		const lrsPassword = config.lrs.apiSecretDefault;

		if (!lrsEndpoint || !lrsUsername || !lrsPassword) {
			throw new Error('Invalid LRS configuration: endpoint, api key and api secret are required.');
		}

		this.jstracker.trackerSettings.batch_endpoint = `${lrsEndpoint}/xapi`;
		this.jstracker.trackerSettings.oauth_type = "OAuth1";
		logger.info(this.jstracker.trackerSettings, 'JS SCORM Tracker settings configured');
		this.jstracker.oauth1.username = lrsUsername;
		this.jstracker.oauth1.password = lrsPassword;
		logger.info(this.jstracker.oauth1, 'JS SCORM Tracker OAuth settings configured');
		await this.jstracker.login(); // Authenticate with the LRS before sending any statements
		this.jstracker.start(); // Initialize the tracker before using it
	}

	flush() {
		this.flushLRS = true;
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

	private normalizeStatementForLRS(statement: any): any {
		if (!statement || typeof statement !== 'object') {
			return statement;
		}

		const normalized = { ...statement };
		const score = normalized?.result?.score;
		if (score && typeof score === 'object') {
			const toNumber = (value: any): number | undefined => {
				if (value === null || value === undefined || value === '') {
					return undefined;
				}
				const parsed = typeof value === 'number' ? value : Number(value);
				return Number.isFinite(parsed) ? parsed : undefined;
			};

			const scaled = toNumber(score.scaled);
			if (scaled !== undefined) {
				score.scaled = Math.max(-1, Math.min(1, scaled));
			}

			const raw = toNumber(score.raw);
			if (raw !== undefined) {
				score.raw = raw;
			}

			const min = toNumber(score.min);
			if (min !== undefined) {
				score.min = min;
			}

			const max = toNumber(score.max);
			if (max !== undefined) {
				score.max = max;
			}
		}

		const definition = normalized?.object?.definition;
		if (definition && typeof definition === 'object') {
			const normalizeInteractionComponents = (components: any, prefix: string): any => {
				if (!Array.isArray(components)) {
					return components;
				}
				return components.map((component: any, index: number) => {
					const normalizedComponent = (component && typeof component === 'object') ? { ...component } : { id: component };
					const candidateId = normalizedComponent?.id;
					if (candidateId === null || candidateId === undefined || String(candidateId).trim() === '') {
						normalizedComponent.id = `${prefix}_${index + 1}`;
					} else {
						normalizedComponent.id = String(candidateId);
					}
					return normalizedComponent;
				});
			};

			definition.scale = normalizeInteractionComponents(definition.scale, 'likert');
			definition.choices = normalizeInteractionComponents(definition.choices, 'choice');
			definition.source = normalizeInteractionComponents(definition.source, 'source');
			definition.target = normalizeInteractionComponents(definition.target, 'target');
			definition.steps = normalizeInteractionComponents(definition.steps, 'step');
		}

		return normalized;
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
		const shutdown = () => {
			logger.info('Shutdown signal received, flushing data and saving bloom filter...');
			if(this.jstracker) {
				this.jstracker.flush();
			}
			this.saveToFile();
		};
		process.on('SIGTERM', shutdown);
		process.on('SIGINT', shutdown);
		process.on('beforeExit', shutdown);
	}

	updateMissingTraceElements(participant: string, trace : any, simletId: number, sessionId: number, activityId: number): any {
		let updatedStatement = trace;
		logger.info('Updating missing trace elements');
        const now = new Date();
        if(!trace.id) {
            updatedStatement.withId(this.generateStatementId(trace));
        }
        if(!trace.timestamp) {
            updatedStatement.withTimestamp(now.toISOString());
        }
        if(!trace.version) {
            updatedStatement.withVersion("1.0.3");
        }
		updatedStatement.withAutorityAccount(participant, config.externalUrl);
		updatedStatement.withStored(now.toISOString());
		updatedStatement.withContextActivity(
					this.jstracker.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.PARENT,
					`${config.externalUrl}/activities/${activityId}`,
					'course'
				)
				.withContextActivity(
					this.jstracker.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.GROUPING,
					`${config.externalUrl}/simlets/${simletId}/sessions/${sessionId}`,
					'course'
				)
				.withContextActivity(
					this.jstracker.STATEMENT_BUILDER_IDS.CONTEXT.ACTIVITIES.GROUPING,
					`${config.externalUrl}/simlets/${simletId}/sessions/${sessionId}/activities/${activityId}`,
					'course'
				)
        return updatedStatement;
    }

	async sendTracesToKafka(traces: any[], activityId: number): Promise<number[]> {
		let payloads = [];
		let responses = [];
		for (var i = traces.length - 1; i >= 0; i--) {
			let trace = traces[i].toXAPI();
			responses.push(trace.id);
			payloads.push(JSON.stringify(trace));
		}
		await kafkaClient.sendMessages(payloads, 0, JSON.stringify({ _id: activityId }));
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
		await this.jstracker.flush();
		if(this.flushLRS) {
			await this.jstracker.flush();
			this.flushLRS = false;
		}
		return ids;
	}

	async setStatement(statement: any, simletId: number, sessionId: number, activityId: number, participant: string): Promise<number[]> {
		if (config.lrs.enabled && !this.jstracker) {
			await this.initJSScormTracker();
		}
		let toret: number[] = [];
        if(Array.isArray(statement)){
            const traces: any[] = [];
            for(let traceId = 0; traceId < statement.length; traceId++) {
				const normalizedTrace = this.normalizeStatementForLRS(statement[traceId]);
				const traceBuilder = this.jstracker.fromXAPI(normalizedTrace);
                traces.push(this.updateMissingTraceElements(participant, traceBuilder, simletId, sessionId, activityId));
            }
			let response: number[] = [];
			if(config.lrs.enabled) {
            	 response = await this.sendTracesToLRS(traces);
			} else {
				response = await this.sendTracesToKafka(traces, activityId);
			}
            toret = response;
        } else if(statement && typeof statement === 'object'){
			const normalizedTrace = this.normalizeStatementForLRS(statement);
			const traceBuilder = this.jstracker.fromXAPI(normalizedTrace);
            const trace = this.updateMissingTraceElements(participant, traceBuilder, simletId, sessionId, activityId);
            let response: number[] = [];
			if(config.lrs.enabled) {
            	 response = await this.sendTracesToLRS([trace]);
			} else {
				response = await this.sendTracesToKafka([trace], activityId);
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