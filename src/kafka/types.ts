import { EachMessagePayload } from 'kafkajs';

export type SilkEngineType = {
  consumerId: string;

  start(): Promise<void>;
  shutdown(): Promise<void>;
  subscribe(kafkaTopic: string, fromBeginning: boolean): void;
  /**
   * Adds a merchant to the workflow for coordinating and executing jobs
   * @param merchant
   */
  addMerchant(merchant: MerchantType): void;
  getMerchants(): MerchantType[];
  /**
   * handles message serialization and coordinating job execution for merchants based on topic of message consumed
   * @param message message to serialize
   */
  coordinate(message: EachMessagePayload): Promise<void>;
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

export type MerchantType = {
  topic: string;
  event: string;
  model: CentralizedSingleInstance;
  job: JobType;

  execute(messageData: Record<string, unknown>): Promise<void>;
};

export type KafkaConfig = {
  broker: string;
};

export interface KafkaSASLConfig extends KafkaConfig {
  saslUsername: string;
  saslPassword: string;
}
