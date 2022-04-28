/**
 * example for how to use insightQL
 *  - create consumer object
 *  - subscribe consumer to topics
 *  - define model to deserialize messages
 *  - define agent and asynchronous job to execute
 *  - add agent to consumer workflow
 *  - add consumer to app
 *  - init app
 */
import app from './app.js';
import { Config } from './config.js';
import KafkaConsumer from './kafka/consumer.js';
import { Agent, DataObject } from './kafka/types.js';

// kafka consumer config
const consumer = new KafkaConsumer({
  saslUsername: Config.kafkaSASLUsername,
  saslPassword: Config.kafkaSASLPassword,
  broker: Config.kafkaBroker,
});
// subscribe to topics
consumer.subscribe(Config.kafkaTopic);
// define data model to deserialize messages
class Data extends DataObject {
  ordertime!: number;
  orderid!: number;
}
// create agent to handle topic messages with data model and asynchronous job
const agent: Agent = {
  topic: Config.kafkaTopic,
  model: new Data(),
  job: async (message: Data) => {
    app.db.set('order-id', message.orderid); // use inmemory keyvalue store
    // eslint-disable-next-line no-console
    console.log('orderid: ' + app.db.get('order-id') + ' was stored in-memory.');
  },
};
// add agent to consumer
consumer.addAgent(agent);
// add consumer to app
app.addConsumer(consumer);
// init app
app.startServer();
