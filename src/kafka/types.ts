export class DataObject {
  [keys: string]: any;
  /**
   * Helps ensure that this object is ready for the next message serialization.
   * @param obj resets this DataObject
   */
  public resetProperties(obj: this = this) {
    Object.keys(obj).map(key => {
      // Test if it's an Object
      if (obj[key] === Object(obj[key])) {
        this.resetProperties(obj[key]);
        return;
      }
      if (obj[key] instanceof Array) obj[key] = [];
      else obj[key] = undefined;
    });
  }
  /**
   * Helps ensure that the message serialization was successful.
   * @param obj validates this DataObject
   * @returns
   */
  public validObject(obj: this = this) {
    for (const key in obj) {
      if (obj[key] === undefined) return false;
    }
    return true;
  }
}

type Job = {
  (...args: any): Promise<void>;
};

export interface Agent {
  topic: string;
  model: DataObject;
  job: Job;
}

export type KafkaConfig = {
  broker: string;
};

export interface KafkaSASLConfig extends KafkaConfig {
  saslUsername: string;
  saslPassword: string;
}
