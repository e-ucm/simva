import { logger } from '@/lib/logger';
import { Kafka, EachMessagePayload, RecordMetadata, KafkaMessage, Producer, Consumer, logLevel } from 'kafkajs'; 
import { config } from '@/lib/config';

/**
 * Configuration options for KafkaClient
 */
export interface KafkaOpts {
    clientId: string;
    brokers: string[];
    groupId: string;
    topic: string;
}

/**
 * Message callback type for consumer
 */
export type MessageHandler = (message: KafkaMessage) => void | Promise<void>;

/**
 * KafkaClient - Optimized TypeScript client for Kafka operations
 * 
 * Features:
 * - Connection state management (avoids redundant connections)
 * - Type-safe message handling
 * - Structured logging
 * - Proper error propagation
 * - Graceful shutdown support
 */
class KafkaClient {
    readonly #clientId: string;
    readonly #brokers: string[];
    readonly #groupId: string;
    readonly #topic: string;
    readonly #kafka: Kafka | null;
    readonly #consumer: Consumer | null;
    readonly #producer: Producer | null;
    readonly #initialized: boolean;
    
    #producerConnected = false;
    #consumerConnected = false;

    constructor(opts: KafkaOpts) {
        this.#clientId = opts.clientId;
        this.#brokers = opts.brokers;
        this.#groupId = opts.groupId;
        this.#topic = opts.topic;
        
        if (!Kafka) {
            logger.error('kafkajs package not available - install with: npm install kafkajs');
            this.#kafka = null;
            this.#consumer = null;
            this.#producer = null;
            this.#initialized = false;
            return;
        }
        
        this.#kafka = new Kafka({
            logLevel: logLevel.INFO,
            clientId: this.#clientId,
            brokers: this.#brokers
        });
        
        this.#consumer = this.#kafka.consumer({ groupId: this.#groupId });
        this.#producer = this.#kafka.producer();
        this.#initialized = true;
        
        logger.info({ clientId: this.#clientId, brokers: this.#brokers, topic: this.#topic }, 'KafkaClient initialized');
    }

    /**
     * Check if client is properly initialized
     */
    get isInitialized(): boolean {
        return this.#initialized;
    }

    /**
     * Get the configured topic
     */
    get topic(): string {
        return this.#topic;
    }

    /**
     * Check if producer is connected
     */
    get isProducerConnected(): boolean {
        return this.#producerConnected;
    }

    /**
     * Check if consumer is connected
     */
    get isConsumerConnected(): boolean {
        return this.#consumerConnected;
    }

    /**
     * Ensure client is properly initialized
     * @throws Error if not initialized
     */
    private ensureInitialized(): void {
        if (!this.#initialized || !this.#kafka || !this.#consumer || !this.#producer) {
            throw new Error('KafkaClient is not initialized - ensure kafkajs package is installed');
        }
    }

    /**
     * Transform a message to Kafka format with validation
     * @param message - Message value (must be string)
     * @param partition - Optional partition number
     * @param key - Optional message key
     * @returns Formatted Kafka message
     * @throws Error if message or key is not a string
     */
    private transformMessageToKafkaFormat(message: string, partition?: number, key?: string): KafkaMessage {
        if (typeof message !== 'string') {
            throw new Error('Message must be a string');
        }
        return { 
            value:  Buffer.from(message), 
            key: key ? Buffer.from(key) : Buffer.from(""), 
            offset: "0", 
            headers: {},
            timestamp: Date.now().toString(), 
            attributes: partition ? partition : 0 
        };
    }

    /**
     * Log record metadata from send result
     */
    private logSendResult(result: RecordMetadata[], context: { key?: string; partition?: number }): void {
        const logParts = [`Messages sent to topic ${this.#topic}`];
        if (context.key !== undefined) logParts.push(`using key ${context.key}`);
        if (context.partition !== undefined) logParts.push(`at partition ${context.partition}`);
        
        logger.info({ topic: this.#topic, ...context }, logParts.join(' '));
        
        for (const record of result) {
            logger.info({ partition: record.partition, offset: record.baseOffset }, 'Message stored');
        }
    }

    /**
     * Connect to the consumer and subscribe to the topic
     * @throws Error if connection fails
     */
    async connectToConsumer(): Promise<void> {
        this.ensureInitialized();
        
        if (this.#consumerConnected) {
            logger.debug('Consumer already connected');
            return;
        }

        logger.info({ brokers: this.#brokers }, 'Connecting Kafka consumer');
        await this.#consumer!.connect();
        await this.#consumer!.subscribe({ topic: this.#topic, fromBeginning: false });
        this.#consumerConnected = true;
        logger.info({ topic: this.#topic }, 'Kafka consumer subscribed');
    }

    /**
     * Connect to the producer
     * @throws Error if connection fails
     */
    async connectToProducer(): Promise<void> {
        this.ensureInitialized();
        
        if (this.#producerConnected) {
            logger.debug('Producer already connected');
            return;
        }

        logger.info({ brokers: this.#brokers }, 'Connecting Kafka producer');
        await this.#producer!.connect();
        this.#producerConnected = true;
        logger.info({ topic: this.#topic }, 'Kafka producer connected');
    }

    /**
     * Ensure producer is connected before sending
     */
    private async ensureProducerConnected(): Promise<void> {
        if (!this.#producerConnected) {
            await this.connectToProducer();
        }
    }

    /**
     * Send a single message to the topic
     * @param message - Message value (string)
     * @param partition - Optional partition number
     * @param key - Optional message key
     * @throws Error if send fails
     */
    async sendMessage(message: string, partition?: number, key?: string): Promise<void> {
        await this.ensureProducerConnected();
        
        const payload = {
            topic: this.#topic,
            messages: [this.transformMessageToKafkaFormat(message, partition, key)]
        };
        
        const result = await this.#producer!.send(payload);
        this.logSendResult(result, { key, partition });
    }

    /**
     * Send multiple messages to the topic
     * @param messages - Array of message values (strings)
     * @param partition - Optional partition number (applies to all messages)
     * @param key - Optional message key (applies to all messages)
     * @throws Error if send fails
     */
    async sendMessages(messages: string[], partition?: number, key?: string): Promise<void> {
        await this.ensureProducerConnected();
        
        const formattedMessages = messages.map(msg => 
            this.transformMessageToKafkaFormat(msg, partition, key)
        );
        
        const payload = {
            topic: this.#topic,
            messages: formattedMessages
        };
        
        const result = await this.#producer!.send(payload);
        this.logSendResult(result, { key, partition });
    }

    /**
     * Send a message to a specific topic (different from configured topic)
     * @param topic - Target topic
     * @param message - Message value (string)
     * @param partition - Optional partition number
     * @param key - Optional message key
     */
    async sendMessageToTopic(topic: string, message: string, partition?: number, key?: string): Promise<void> {
        await this.ensureProducerConnected();
        
        const payload = {
            topic,
            messages: [this.transformMessageToKafkaFormat(message, partition, key)]
        };
        
        const result = await this.#producer!.send(payload);
        logger.info({ topic, key, partition }, 'Message sent to custom topic');
        for (const record of result) {
            logger.info({ partition: record.partition, offset: record.baseOffset }, 'Message stored');
        }
    }

    /**
     * Start consuming messages from the topic
     * @param onMessage - Callback function for each message
     * @param concurrency - Number of partitions to consume concurrently (default: 1)
     */
    async consumeLatestMessages(onMessage: MessageHandler, concurrency = 1): Promise<void> {
        await this.connectToConsumer();
        
        logger.info({ topic: this.#topic, concurrency }, 'Starting message consumption');
        
        await this.#consumer!.run({
            partitionsConsumedConcurrently: concurrency,
            eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
                    // Call the provided onMessage callback with the message info
                    logger.debug({ topic, partition }, 'Processing message');
                    onMessage(message);
            }
        });
    }

    /**
     * Disconnect the consumer
     */
    async disconnectConsumer(): Promise<void> {
        if (!this.#consumerConnected || !this.#consumer) {
            logger.debug('Consumer not connected');
            return;
        }

        await this.#consumer.disconnect();
        this.#consumerConnected = false;
        logger.info('Kafka consumer disconnected');
    }

    /**
     * Disconnect the producer
     */
    async disconnectProducer(): Promise<void> {
        if (!this.#producerConnected || !this.#producer) {
            logger.debug('Producer not connected');
            return;
        }

        await this.#producer.disconnect();
        this.#producerConnected = false;
        logger.info('Kafka producer disconnected');
    }

    /**
     * Disconnect both consumer and producer
     */
    async disconnect(): Promise<void> {
        await Promise.all([
            this.disconnectConsumer(),
            this.disconnectProducer()
        ]);
        logger.info('KafkaClient fully disconnected');
    }
}

let kafkaClient = new KafkaClient(config.kafka);
export { kafkaClient };
export default KafkaClient;