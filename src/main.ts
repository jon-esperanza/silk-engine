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
class MarkedBook extends MessageData {
  bookId!: number;
  userId!: number;
  title!: string;
  author!: string;
  genre!: string;
  dateMarked!: string;
}
// create agent to handle topic messages with data model and asynchronous job
const agent = new Agent(Config.kafkaTopic, '18', new MarkedBook(), async (messageData: MarkedBook): Promise<void> => {
  const prefix = `user:${messageData.userId}:markedBooks`;
  const db = app.getRedis();
  await db.sAdd(prefix, JSON.stringify(messageData)); // use redis cache
  const data = await db.sMembers(prefix);
  // eslint-disable-next-line no-console
  console.log({ user: messageData.userId, markedBooks: data.map(obj => JSON.parse(obj)) });
});
// add agent to consumer
consumer.addAgent(agent);
// add consumer to app
app.addConsumer(consumer);
// init app
app.startServer();
