import { Consumer, ConsumerSubscribeTopic, EachMessagePayload, Kafka, KafkaMessage } from 'kafkajs';
import { Agent, KafkaSASLConfig } from './types.js';
import { v4 as uuid } from 'uuid';

export default class KafkaConsumer {
  public consumerId: string;
  private kafkaConsumer: Consumer;
  private kafkaTopics: ConsumerSubscribeTopic[];
  private kafkaAgents: Agent[];

  public constructor(consumerConfig: KafkaSASLConfig) {
    this.consumerId = uuid();
    this.kafkaConsumer = this.createKafkaConsumerSASL(consumerConfig);
    this.kafkaTopics = [];
    this.kafkaAgents = [];
  }

  public async startConsumer(): Promise<void> {
    try {
      await this.kafkaConsumer.connect();
      this.kafkaTopics.forEach(async topic => {
        await this.kafkaConsumer.subscribe(topic);
      });
      await this.kafkaConsumer.run({
        eachMessage: async (messagePayload: EachMessagePayload) => {
          const { topic, partition, message } = messagePayload;
          const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
          // eslint-disable-next-line no-console
          console.log(`- ${prefix} ${message.key}#${message.value}`);
          this.kafkaAgents.forEach(async agent => {
            if (topic === agent.topic && message.value != undefined) {
              await this.executeAgent(agent, message);
            }
          });
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error: ', error);
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
    await this.kafkaConsumer.disconnect();
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

  private async executeAgent(agent: Agent, message: KafkaMessage) {
    const jsonData = JSON.parse(String(message.value)); // message.value into generic object
    const data = Object.assign(agent.model, jsonData); // map generic object properties to target object
    if (!agent.model.validObject()) {
      // validate the success of property mapping
      // eslint-disable-next-line no-console
      console.log('Error: message failed to be serialized to the DataObject provided.');
    } else {
      await agent.job(data).then(() => {
        // execute user-provided job
        agent.model.resetProperties(); // clean target object for next message serialization
      });
    }
  }
}
