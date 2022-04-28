#!/usr/bin/env node

/**
 * App server instance
 * Make sure to configure server AND add consumers before starting
 */

import 'dotenv/config';
import { Config } from './config.js';
import { Application } from 'express';
import express from 'express';
import KafkaConsumer from './kafka/consumer.js';
import { Server } from 'http';

class App {
  private consumers: KafkaConsumer[];
  private port: number = Config.port;
  private app: Application;
  private server!: Server;

  constructor() {
    this.consumers = [];
    this.app = express();
  }

  public startServer() {
    this.server = this.app.listen(this.port, () => {
      this.initConsumers().then(() => {
        // eslint-disable-next-line no-console
        console.log(`🚂 Listening on port: ${this.port}`);
      });
    });
    process.on('SIGTERM', this.gracefulShutdown);
    process.on('SIGINT', this.gracefulShutdown);
  }

  public addConsumer(consumer: KafkaConsumer) {
    this.consumers.push(consumer);
  }

  private async initConsumers(): Promise<void> {
    this.consumers.forEach(async consumer => {
      consumer.startConsumer().then(() => {
        // eslint-disable-next-line no-console
        console.log(`🚂 Consumer ${consumer.consumerId} connected.`);
      });
    });
  }
  private async endConsumers(): Promise<void> {
    this.consumers.forEach(async consumer => {
      consumer.shutdown().then(() => {
        // eslint-disable-next-line no-console
        console.log(`\t🚂 Consumer ${consumer.consumerId} disconnected.`);
      });
    });
  }
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
