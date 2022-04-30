import { CentralizedSingleInstance } from '../types.js';

export default class MessageData implements CentralizedSingleInstance {
  [keys: string]: any;

  public clearInstance(obj: this = this): void {
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

  public validInstance(obj: this = this): boolean {
    for (const key in obj) {
      if (obj[key] === undefined) return false;
    }
    return true;
  }
}
