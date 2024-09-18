const { Kafka, logLevel } = require('kafkajs');
const logger = require("./logger.js");

/**
 * @typedef KafkaOpts
 * @property {string} clientId
 * @property {string[]} brokers
 * @property {string} groupId
 * @property {string} topic
 */

class KafkaClient {
    constructor(clientId, brokers, groupId, topic) {
        this.clientId = clientId;
        this.brokers = brokers;
        this.groupId = groupId;
        this.topic = topic;
        this.kafka = new Kafka({ logLevel: logLevel.INFO, clientId: this.clientId, brokers: this.brokers });
        this.consumer = this.kafka.consumer({ groupId: this.groupId });
        this.producer = this.kafka.producer({ groupId: this.groupId });
    }

    // Connect and subscribe to a topic
    async connectToConsumer() {
        try {
            logger.info(`Connecting to Kafka brokers: ${this.brokers}`);
            await this.consumer.connect();
            await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });
            logger.info(`Subscribed to topic: ${this.topic}`);
        } catch (error) {
            logger.error('Error connecting to Kafka:' + error);
        }
    }

    // Connect to the producer
    async connectToProducer() {
        try {
            logger.info(`Connecting to Kafka brokers: ${this.kafka.brokers}`);
            await this.producer.connect();
            logger.info(`Producer connected to topic: ${this.topic}`);
        } catch (error) {
            logger.error('Error connecting producer to Kafka:' + error);
        }
    }

    // Send a message to the topic
    async sendMessage(message, partition, key) {
        try {
            await this.connectToProducer();
            let payload= {
                topic: this.topic,
                messages: [ this.transformMessageToKafkaFormat(message, partition, key)]
            };
            const result = await this.producer.send(payload);
            let log=`Message sent to topic ${this.topic}`;
            if(key) {
                log+=` using key ${key}`;
            }
            if(partition) {
                log+=` at partition ${partition}`;
            }
            logger.info(log);
            result.forEach(record => {
                logger.info(`Messages stored at partition ${record.partition}, offset ${record.baseOffset}`);
            });
        } catch (error) {
            logger.error('Error sending message to Kafka:' + error);
        }
    }

    transformMessageToKafkaFormat(message, partition, key) {
        if(typeof message !== "string") {
            throw "Message has to be a string, not an object";
        }
        let result = { value: message };
        if(key) {   
            if(typeof key !== "string") {
                throw "Key has to be a string, not an object";
            }
            result.key=key;
        }
        if(partition) {
            result.partition=partition;
        }
        return result;
    }

    // Send multiple messages from a list
    async sendMessages(messages, partition, key) {
        try {
            const formatedMessages=messages.map(msg => ( this.transformMessageToKafkaFormat(msg, partition, key)));
            let payload= {
                topic: this.topic,
                messages: formatedMessages
            };
            const result = await this.producer.send(payload);
            let log=`Messages sent to topic ${this.topic}`;
            if(typeof key != "undefined") {
                log+=` using key ${key}`;
            }
            if(typeof partition != "undefined") {
                log+=` at partition ${partition}`;
            }
            logger.info(log);
            result.forEach(record => {
                logger.info(`Messages stored at partition ${record.partition}, offset ${record.baseOffset}`);
            });
        } catch (error) {
            logger.error('Error sending messages to Kafka:' + error);
        }
    }

    // Run the consumer and process messages
    async consumeLatestMessages(onMessage) {
        try {
            await this.connectToConsumer();

            logger.info(`Listening for messages from topic: ${this.topic}`);

            await this.consumer.run({
                // By default, eachMessage is invoked sequentially for each message in each partition. 
                // In order to concurrently process several messages per once, you can increase the partitionsConsumedConcurrently option.
                partitionsConsumedConcurrently: 1, 
                eachMessage: async ({ topic, partition, message }) => {
                    const msgValue = message.value.toString();
                    const msgOffset = message.offset;
                    const msgPartition = partition;

                    const messageInfo = {
                        topic,
                        partition: msgPartition,
                        offset: msgOffset,
                        value: msgValue
                    };

                    // Call the provided onMessage callback with the message info
                    onMessage(messageInfo);
                }
            });
        } catch (error) {
            logger.error('Error consuming messages:' + error);
        }
    }

    // Disconnect the consumer
    async disconnectConsumer() {
        try {
            await this.consumer.disconnect();
            logger.info('Kafka consumer disconnected');
        } catch (error) {
            logger.error('Error disconnecting from Kafka:', error);
        }
    }

    // Disconnect the producer
    async disconnectProducer() {
        try {
            await this.producer.disconnect();
            logger.info('Kafka producer disconnected');
        } catch (error) {
            logger.error('Error disconnecting from Kafka:', error);
        }
    }
}

module.exports = KafkaClient;