import { Consumer, ConsumerSubscribeTopic, EachMessagePayload, Kafka } from 'kafkajs';
import { KafkaConsumerType, KafkaSASLConfig } from '../types.js';
import { v4 as uuid } from 'uuid';
import { logger } from '../../utils/logger.js';
import Agent from './agent.js';

export default class KafkaConsumer implements KafkaConsumerType {
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
      for (const topic of this.kafkaTopics) {
        // subscribe to topics in sequence
        await this.kafkaConsumer.subscribe(topic);
      }
      await this.kafkaConsumer.run({
        eachMessage: async (message: EachMessagePayload) => this.coordinateMessage(message),
      });
    } catch (error) {
      this.kafkaLogger.error({ err: error, details: 'Failed to start consumer' });
    }
  }

  public async shutdown(): Promise<void> {
    await this.kafkaConsumer.disconnect().then(() => {
      this.kafkaLogger.kafka('Disconnected');
    });
  }

  public subscribe(kafkaTopic: string, fromBeginning: boolean = false): void {
    const topic: ConsumerSubscribeTopic = {
      topic: kafkaTopic,
      fromBeginning: fromBeginning,
    };
    this.kafkaTopics.push(topic);
  }

  public addAgent(agent: Agent): void {
    this.kafkaAgents.push(agent);
  }

  public getAgents(): Agent[] {
    return this.kafkaAgents;
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

  public async coordinateMessage(messagePayload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = messagePayload;
    const jsonData = JSON.parse(String(message.value)); // message.value into generic object
    const key = String(message.key);
    this.kafkaLogger.kafka({
      prefix: `${topic}[${partition} | ${message.offset}]`,
      key: key,
    });
    await Promise.all(
      this.kafkaAgents.map(async agent => {
        // run async agents in parallel
        const validateSrc = agent.validateHeader ? message.headers : key;
        if (topic === agent.topic && validateSrc === agent.event && jsonData != undefined) {
          await agent.executeAgent(jsonData);
        }
      }),
    );
  }
}
