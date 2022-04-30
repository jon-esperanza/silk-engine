import { logger } from '../../utils/logger.js';
import { AgentType, JobType } from '../types.js';
import MessageData from './messageData.js';

export default class Agent implements AgentType {
  public topic: string;
  public model: MessageData;
  public job: JobType;

  constructor(topic: string, model: MessageData, job: JobType) {
    this.topic = topic;
    this.model = model;
    this.job = job;
  }

  public async executeAgent(messageData: Record<string, unknown>): Promise<void> {
    const data = Object.assign(this.model, messageData); // map generic object properties to target object
    if (!this.model.validInstance()) {
      // validate the success of property mapping
      logger.error('Kafka topic message failed to be serialized to the MessageData class provided');
    } else {
      await this.job(data).then(() => {
        // execute user-provided job
        this.model.clearInstance(); // clean target object for next message serialization
      });
    }
  }
}
