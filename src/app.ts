#!/usr/bin/env node

/**
 * App server instance
 * Make sure to configure server AND add consumers before starting
 */

import 'dotenv/config';
import { Config } from './config.js';
import { Application } from 'express';
import * as redis from 'redis';
import express from 'express';
import KafkaConsumer from './kafka/consumer.js';
import { Server } from 'http';
import { createDatabase } from './db/inMemory.js';
import { Database, redisConfig } from './db/types.js';

class App {
  private consumers: KafkaConsumer[];
  private port: number = Config.port;
  private app: Application;
  private server!: Server;
  private redisEnabled: boolean = false;
  private redisUrl: string = '';
  public db!: Database | any;

  constructor() {
    this.consumers = [];
    this.app = express();
  }

  public startServer() {
    if (this.redisEnabled) {
      this.db = redis.createClient({ url: this.redisUrl });
      this.db.connect().then(() => {
        // eslint-disable-next-line no-console
        console.log(`🚂 Connected to redis.`);
      });
    } else {
      this.db = createDatabase();
    }
    this.server = this.app.listen(this.port, () => {
      this.initConsumers().then(() => {
        // eslint-disable-next-line no-console
        console.log(`🚂 Listening on port: ${this.port}`);
      });
    });
    process.on('SIGTERM', this.gracefulShutdown);
    process.on('SIGINT', this.gracefulShutdown);
  }

  /**
   * @param consumer consumer to add to app
   */
  public addConsumer(consumer: KafkaConsumer) {
    this.consumers.push(consumer);
  }

  public useRedis(config: string | redisConfig) {
    if (typeof config === 'string') {
      this.redisUrl = config;
    } else {
      this.redisUrl = `redis://${config.username}:${config.password}@${config.host}:${config.port}`;
    }
    this.redisEnabled = true;
  }

  /**
   * iterate over consumers added to app, connect them to respective kafka topic
   */
  private async initConsumers(): Promise<void> {
    this.consumers.forEach(async consumer => {
      consumer.startConsumer().then(() => {
        // eslint-disable-next-line no-console
        console.log(`🚂 Consumer ${consumer.consumerId} connected.`);
      });
    });
  }

  /**
   * disconnect all consumers on app from kafka topics
   */
  private async endConsumers(): Promise<void> {
    this.consumers.forEach(async consumer => {
      consumer.shutdown().then(() => {
        // eslint-disable-next-line no-console
        console.log(`\t🚂 Consumer ${consumer.consumerId} disconnected.`);
      });
    });
  }

  /**
   * gracefully terminate app
   */
  private gracefulShutdown() {
    // eslint-disable-next-line no-console
    console.log('\n⚠️  Starting shutdown process...');
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log('\t🤞 Shutting down application');
      this.endConsumers;
      // stop the server from accepting new connections
      this.server.close(function () {
        // eslint-disable-next-line no-console
        console.log('\t👋 All requests stopped, shutting down');
        // once the server is not accepting connections, exit
        process.exit();
      });
    }, 0);
  }
}
export default new App();
