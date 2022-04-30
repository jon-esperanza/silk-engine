import { EachMessagePayload } from 'kafkajs';

export type KafkaConsumerType = {
  consumerId: string;

  startConsumer(): Promise<void>;
  shutdown(): Promise<void>;
  subscribe(kafkaTopic: string, fromBeginning: boolean): void;
  /**
   * Adds an agent to the array, these agents are used to coordinate and execute jobs
   * @param agent agent to add to kafka consumer
   */
  addAgent(agent: AgentType): void;
  getAgents(): AgentType[];
  /**
   * handles message serialization and coordinating job execution for agents based on topic of message consumed
   * @param message message to serialize
   */
  coordinateMessage(message: EachMessagePayload): Promise<void>;
};

export type CentralizedSingleInstance = {
  [keys: string]: any;

  /**
   * Helps ensure that this single instance is cleared and ready for the next message serialization.
   */
  clearInstance(): void;
  /**
   * Helps ensure that the message serialization was successful.
   * @returns boolean
   */
  validInstance(): boolean;
};

export type JobType = {
  (...args: any): Promise<void>;
};

export type AgentType = {
  topic: string;
  model: CentralizedSingleInstance;
  job: JobType;

  executeAgent(messageData: Record<string, unknown>): Promise<void>;
};

export type KafkaConfig = {
  broker: string;
};

export interface KafkaSASLConfig extends KafkaConfig {
  saslUsername: string;
  saslPassword: string;
}
