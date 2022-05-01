import { Consumer, ConsumerSubscribeTopic, EachMessagePayload, Kafka } from 'kafkajs';
import { SilkEngineType, KafkaSASLConfig } from '../types.js';
import { v4 as uuid } from 'uuid';
import { logger } from '../../utils/logger.js';
import Merchant from './Merchant.js';

export default class SilkEngine implements SilkEngineType {
  public consumerId: string;
  private kafkaConsumer: Consumer;
  private kafkaTopics: ConsumerSubscribeTopic[];
  private merchants: Merchant[];
  private kafkaLogger: any;

  public constructor(consumerConfig: KafkaSASLConfig) {
    this.consumerId = uuid();
    this.kafkaConsumer = this.createKafkaConsumerSASL(consumerConfig);
    this.kafkaTopics = [];
    this.merchants = [];
    this.kafkaLogger = logger.child({ consumerId: this.consumerId });
  }

  public async start(): Promise<void> {
    try {
      await this.kafkaConsumer.connect().then(() => {
        this.kafkaLogger.kafka('Connected');
      });
      for (const topic of this.kafkaTopics) {
        // subscribe to topics in sequence
        await this.kafkaConsumer.subscribe(topic);
      }
      await this.kafkaConsumer.run({
        eachMessage: async (message: EachMessagePayload) => this.coordinate(message),
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

  public addMerchant(merchant: Merchant): void {
    this.merchants.push(merchant);
  }

  public getMerchants(): Merchant[] {
    return this.merchants;
  }

  private createKafkaConsumerSASL(config: KafkaSASLConfig): Consumer {
    const kafka = new Kafka({
      clientId: 'silk-engine-consumer-' + this.consumerId,
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
    const consumer = kafka.consumer({ groupId: 'silk-engine-consumers' });
    return consumer;
  }

  public async coordinate(messagePayload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = messagePayload;
    const jsonData = JSON.parse(String(message.value)); // message.value into generic object
    const key = String(message.key);
    this.kafkaLogger.kafka({
      prefix: `${topic}[${partition} | ${message.offset}]`,
      key: key,
    });
    await Promise.all(
      this.merchants.map(async merchant => {
        // run async merchants in parallel
        const validateSrc = merchant.validateHeader ? message.headers : key;
        if (topic === merchant.topic && validateSrc === merchant.event && jsonData != undefined) {
          await merchant.execute(jsonData);
        }
      }),
    );
  }
}
