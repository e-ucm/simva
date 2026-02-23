import { v4 as uuidv4 } from 'uuid';
import BloomFilters from 'bloom-filters';
import * as fs from 'fs';
import * as path from 'path';
import { config } from "@/lib/config";
import { logger } from '../logger';
import { kafkaClient } from './kafkaclient';

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
		const shutdown = () => {
			logger.info('Saving bloom filter before shutdown...');
			this.saveToFile();
		};
		process.on('SIGTERM', shutdown);
		process.on('SIGINT', shutdown);
		process.on('beforeExit', shutdown);
	}

	updateMissingTraceElements(participant: string, trace : any) {
        const now = new Date();
        if(!trace.id) {
            trace.id = this.generateStatementId(trace);
        }
        if(!trace.timestamp) {
            trace.timestamp = now.toISOString();
        }
        if(!trace.version) {
            trace.version = "1.0.3";
            //trace.version = "2.0.0";
        }
        trace.stored = now.toISOString();
        trace.authority = {
            homePage: config.external_url,
            name: participant
        };
        return trace;
    }

	async sendTracesToKafka(traces: any[], activityId: number): Promise<number[]> {
		let payloads = [];
		let responses = [];
		for (var i = traces.length - 1; i >= 0; i--) {
			let trace = traces[i];
			responses.push(trace.id);
			payloads.push(JSON.stringify(trace));
		}
		await kafkaClient.sendMessages(payloads, 0, JSON.stringify({ _id: activityId }));
		return responses;
	}

	async setStatement(statement: any, activityId: number, participant: string): Promise<number[]> {
		let toret: number[] = [];
        if(Array.isArray(statement)){
            var traces= [];
            for(let traceId = 0; traceId < statement.length; traceId++) {
                var trace = statement[traceId];
                traces.push(this.updateMissingTraceElements(participant, trace));
            }
            let response = await this.sendTracesToKafka(traces, activityId);
            toret = response;
        } else if(!statement || typeof statement === 'object'){
            trace = this.updateMissingTraceElements(participant, statement);
            let response = await this.sendTracesToKafka([trace], activityId);
            toret = response;
        } else {
            logger.info('Unknown case');
            logger.info(statement);
            throw { message: 'Unknown case setting the statements' };
        }
        return toret;
	}
}

export const lrsclient = new LRSClient();
lrsclient.registerShutdownHandler();
export default LRSClient;