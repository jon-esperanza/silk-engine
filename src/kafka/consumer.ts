import { Consumer, ConsumerSubscribeTopic, EachMessagePayload, Kafka } from 'kafkajs';
import { Agent, KafkaSASLConfig } from './types.js';
import { v4 as uuid } from 'uuid';
import { logger } from '../utils/logger.js';

export default class KafkaConsumer {
  public consumerId: string;
  private kafkaConsumer: Consumer;
  private kafkaTopics: ConsumerSubscribeTopic[];
  private kafkaAgents: Agent[];
  private kafkaLogger: any;

  public constructor(consumerConfig: KafkaSASLConfig) {
    this.consumerId = uuid();
    this.kafkaConsumer = this.createKafkaConsumerSASL(consumerConfig);
    this.kafkaTopics = [];
    this.kafkaAgents = [];
    this.kafkaLogger = logger.child({ consumerId: this.consumerId });
  }

  public async startConsumer(): Promise<void> {
    try {
      await this.kafkaConsumer.connect().then(() => {
        this.kafkaLogger.kafka('Connected');
      });
      this.kafkaTopics.forEach(async topic => {
        await this.kafkaConsumer.subscribe(topic);
      });
      await this.kafkaConsumer.run({
        eachMessage: async (messagePayload: EachMessagePayload) => {
          const { topic, partition, message } = messagePayload;
          const jsonData = JSON.parse(String(message.value)); // message.value into generic object
          this.kafkaLogger.kafka({
            prefix: `${topic}[${partition} | ${message.offset}]`,
            key: String(message.key),
            value: jsonData, // remove bc sensitive data
          });
          this.kafkaAgents.forEach(async agent => {
            if (topic === agent.topic && jsonData != undefined) {
              await this.executeAgent(agent, jsonData);
            }
          });
        },
      });
    } catch (error) {
      this.kafkaLogger.error({ err: error, details: 'Failed to start consumer' });
    }
  }

  public subscribe(kafkaTopic: string, fromBeginning: boolean = false) {
    const topic: ConsumerSubscribeTopic = {
      topic: kafkaTopic,
      fromBeginning: fromBeginning,
    };
    this.kafkaTopics.push(topic);
  }

  public addAgent(agent: Agent) {
    this.kafkaAgents.push(agent);
  }

  public getAgents(): Agent[] {
    return this.kafkaAgents;
  }

  public async shutdown(): Promise<void> {
    await this.kafkaConsumer.disconnect().then(() => {
      this.kafkaLogger.kafka('Disconnected');
    });
  }

  private createKafkaConsumerSASL(config: KafkaSASLConfig): Consumer {
    const kafka = new Kafka({
      clientId: 'insightql-consumer-' + this.consumerId,
      ssl: {
        rejectUnauthorized: true,
      },
      sasl: {
        mechanism: 'plain', // scram-sha-256 or scram-sha-512,
        username: config.saslUsername,
        password: config.saslPassword,
      },
      brokers: [config.broker],
    });
    const consumer = kafka.consumer({ groupId: 'insightql-consumers' });
    return consumer;
  }

  private async executeAgent(agent: Agent, messageData: Record<string, unknown>) {
    const data = Object.assign(agent.model, messageData); // map generic object properties to target object
    if (!agent.model.validObject()) {
      // validate the success of property mapping
      this.kafkaLogger.kafka({
        details: 'Kafka topic message failed to be serialized to the DataObject provided',
      });
    } else {
      await agent.job(data).then(() => {
        // execute user-provided job
        agent.model.resetProperties(); // clean target object for next message serialization
      });
    }
  }
}
