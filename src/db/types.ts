export interface Database {
  set(key: string, value: any): void;
  get(key: string): any | undefined;
}

export type redisConfig = {
  host: string;
  port: string;
  username: string;
  password: string;
};
