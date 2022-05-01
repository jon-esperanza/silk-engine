import { logger } from '../../utils/logger.js';
import { MerchantType, JobType } from '../types.js';
import MessageData from './MessageData.js';

export default class Merchant implements MerchantType {
  public topic: string;
  public event: string;
  public model: MessageData;
  public job: JobType;
  public validateHeader: boolean = false;

  constructor(topic: string, event: string, model: MessageData, job: JobType, validateHeader?: boolean) {
    this.topic = topic;
    this.event = event;
    this.model = model;
    this.job = job;
    if (validateHeader != undefined) {
      this.validateHeader = validateHeader;
    }
  }

  public async execute(messageData: Record<string, unknown>): Promise<void> {
    const data = Object.assign(this.model, messageData); // serialize generic object properties to single model instance aka cache message data
    if (!this.model.validInstance()) {
      // validate the serialization
      logger.error('Kafka topic message failed to be serialized to the MessageData class provided');
    } else {
      await this.job(data).then(() => {
        // execute user-provided job
        this.model.clearInstance(); // clean single model instance for next message serialization
      });
    }
  }
}
