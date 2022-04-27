import { Client } from 'ts-postgres';

type ClientConfig = {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
};

export default class PostgresDB {
  private client: Client;

  public constructor(config: ClientConfig) {
    this.client = new Client(config);
  }

  public async startConnection(): Promise<void> {
    await this.client.connect();
  }
  public async endConnection(): Promise<void> {
    await this.client.end();
  }
}
