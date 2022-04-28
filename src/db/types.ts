export interface Database {
  set(key: string, value: any): void;
  get(key: string): any | undefined;
}
