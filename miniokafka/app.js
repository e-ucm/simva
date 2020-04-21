/*'use strict';

var kafka = require('kafka-node'),
    Consumer = kafka.Consumer,
    HighLevelProducer = kafka.HighLevelProducer,
    Offset = kafka.Offset;


var kafkaService = function (clientUri, callback) {
    var cl;
    var pr;
    var co;

    var kafkaservice = this;

    var client = function () {
        if (!cl) {
            cl = new kafka.kafkaClient(clientUri);

            cl.on('ready', function () {
                console.log('Client ready');
            });
        }
        return cl;
    };

    var producer = function () {
        if (!pr) {
            pr = new HighLevelProducer(client());

            pr.on('ready', function () {
                console.log('Producer ready');
                callback(null);
            });

            pr.on('error', function (err) {
                console.log('Producer error', err);
                callback(true);
            });
        }

        return pr;
    };

    producer();

    return {
        client: client,
        send: function (topic, data, callback) {
            producer().send([{topic: topic, messages: data}], callback);
        },
        createTopic: function (topicName, callback) {
            producer().createTopics([topicName.toString()], true, callback);
        }
    };
};
 
var Kafka = function () {
    var kafka_config;
    var kafka_service;

    return {
        Init: function(kafkaConfig, callback){
            kafka_config = kafkaConfig;
            kafka_service = kafkaService(kafka_config.uri, function(error){
                if(error){
                    console.log("Error on kafka require: ");
                    callback(true);
                    return;
                }

                kafka_service.createTopic(kafka_config.topicName, function(err, res){
                    if(err){
                        console.info(err);
                        console.log("Error creating kafka topic");
                        callback(true);
                        return;
                    }
                    else{
                        console.log("Kafka running");
                    }

                    callback(null);
                });
            });
        },
        CreateConsumer: function(topic, callback){
            var client = new kafka.kafkaClient(kafka_config.uri);

            var offset = new Offset(client);

            offset.fetch([{ topic: kafka_config.topicName, partition: 0, time: -1 }], function (err, data) {
                var latestOffset = 0;
                
                if(data[kafka_config.topicName]){
                    var latestOffset = data[kafka_config.topicName]['0'][0];
                }

                console.log("Consumer current offset: " + latestOffset);

                var consumer = new Consumer(client, [ { topic: topic, partition: 0, offset: latestOffset } ], { autoCommit: false, fromOffset: true });
                consumer.on('message', callback);
            });
        },
        Send: function(data, callback){
            kafka_service.send(kafka_config.topicName, data, callback);
        }
    };
};

let config = {
	uri: '172.31.0.1:2181',
	topicName: 'kafka-connect'
}

var queue = Kafka();
console.info(config);

queue.Init(config, function(error){
  if(error){
    console.log("Error on kafka Init: " + error);
    return;
  }
});*/


let trace = {
    _id: '123',
    value: 'asddsa'
};

var kafka = require('kafka-node'),
    HighLevelProducer = kafka.HighLevelProducer,
    KeyedMessage = kafka.KeyedMessage,
    client = new kafka.KafkaClient({kafkaHost: '172.31.0.1:9092'}),
    producer = new HighLevelProducer(client),
    km = new KeyedMessage('key', 'message'),
    payloads = [
        { topic: 'traces2', key: JSON.stringify({key: 123}), messages: JSON.stringify(trace), partition: 0}
    ];

console.log('a');
producer.on('ready', function () {
	console.log('ready');
    producer.send(payloads, function (err, data) {
        console.log(data);
        console.log(err);
    });
});

console.log('b');
 
producer.on('error', function (err) {
	console.log(err);
	console.log('error');
})

console.log('c');