import { Consumer, ConsumerSubscribeTopic, EachMessagePayload, Kafka } from 'kafkajs';
import { Config } from './config.js';

export default class KafkaConsumer {
  private kafkaConsumer: Consumer;

  public constructor() {
    this.kafkaConsumer = this.createKafkaConsumer();
  }

  public async startConsumer(): Promise<void> {
    const topic: ConsumerSubscribeTopic = {
      topic: Config.kafkaTopic,
      fromBeginning: false,
    };

    try {
      await this.kafkaConsumer.connect();
      await this.kafkaConsumer.subscribe(topic);

      await this.kafkaConsumer.run({
        eachMessage: async (messagePayload: EachMessagePayload) => {
          const { topic, partition, message } = messagePayload;
          const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
          // eslint-disable-next-line no-console
          console.log(`- ${prefix} ${message.key}#${message.value}`);
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error: ', error);
    }
  }

  public async shutdown(): Promise<void> {
    await this.kafkaConsumer.disconnect();
  }

  private createKafkaConsumer(): Consumer {
    const kafka = new Kafka({
      clientId: 'insightql-consumer',
      ssl: {
        rejectUnauthorized: true,
      },
      sasl: {
        mechanism: 'plain', // scram-sha-256 or scram-sha-512,
        username: Config.kafkaSASLUsername,
        password: Config.kafkaSASLPassword,
      },
      brokers: [Config.kafkaBroker],
    });
    const consumer = kafka.consumer({ groupId: 'insightql-consumers' });
    return consumer;
  }
}
