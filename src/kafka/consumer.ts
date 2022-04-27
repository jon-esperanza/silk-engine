import { Consumer, ConsumerSubscribeTopic, EachMessagePayload, Kafka } from 'kafkajs';
import PostgresDB from 'src/db/postgres';

export default class KafkaConsumer {
  private kafkaConsumer: Consumer;
  private kafkaTopic: string;
  private db: PostgresDB;

  public constructor(consumer: Consumer, topic: string, db: PostgresDB) {
    this.kafkaConsumer = consumer;
    this.kafkaTopic = topic;
    this.db = db;
  }

  public async startConsumer(): Promise<void> {
    const topic: ConsumerSubscribeTopic = {
      topic: this.kafkaTopic,
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

  public static createKafkaConsumerSASL(saslUsername: string, saslPassword: string, broker: string): Consumer {
    const kafka = new Kafka({
      clientId: 'insightql-consumer',
      ssl: {
        rejectUnauthorized: true,
      },
      sasl: {
        mechanism: 'plain', // scram-sha-256 or scram-sha-512,
        username: saslUsername,
        password: saslPassword,
      },
      brokers: [broker],
    });
    const consumer = kafka.consumer({ groupId: 'insightql-consumers' });
    return consumer;
  }
}
