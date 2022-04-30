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
import Agent from './kafka/models/agent.js';
import KafkaConsumer from './kafka/models/consumer.js';
import MessageData from './kafka/models/messageData.js';

// enable and configure redis
app.useRedis({
  host: Config.redisHost,
  port: Config.redisPort,
  username: Config.redisUsername,
  password: Config.redisPassword,
});
// kafka consumer config
const consumer = new KafkaConsumer({
  saslUsername: Config.kafkaSASLUsername,
  saslPassword: Config.kafkaSASLPassword,
  broker: Config.kafkaBroker,
});
// subscribe to topics
consumer.subscribe(Config.kafkaTopic);
// define data model to deserialize messages
class Data extends MessageData {
  ordertime!: number;
  orderid!: number;
}
// create agent to handle topic messages with data model and asynchronous job
const agent = new Agent(Config.kafkaTopic, new Data(), async (): Promise<void> => {
  /* 
    await app.db.set('order-id', message.orderid); */ // use redis cache
  const data = await app.db.get('order-id');
  // eslint-disable-next-line no-console
  console.log('orderid: ' + data + ' was stored redis.');
});
// add agent to consumer
consumer.addAgent(agent);
// add consumer to app
app.addConsumer(consumer);
// init app
app.startServer();
