import { Database } from './types.js';

export function createDatabase(): Database {
  class inMemoryKVDatabase implements Database {
    private db: Record<string, any> = {};

    public set(key: string, value: any) {
      this.db[key] = value;
    }

    public get(key: string): any {
      return this.db[key];
    }
  }

  const db = new inMemoryKVDatabase();
  return db;
}
