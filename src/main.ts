#!/usr/bin/env node

/**
 * This is a sample HTTP server.
 * Replace this with your implementation.
 */

import 'dotenv/config';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { Config } from './config.js';
import PostgresDB from './db/postgres.js';
import KafkaConsumer from './kafka/consumer.js';

const nodePath = resolve(process.argv[1]);
const modulePath = resolve(fileURLToPath(import.meta.url));
const isCLI = nodePath === modulePath;

export default function main(port: number = Config.port) {
  const requestListener = (request: IncomingMessage, response: ServerResponse) => {
    response.setHeader('content-type', 'text/plain;charset=utf8');
    response.writeHead(200, 'OK');
    response.end('Olá, Hola, Hello!');
  };

  const server = createServer(requestListener);
  if (isCLI) {
    // STARTUP
    server.listen(port);
    const consumerSetup = KafkaConsumer.createKafkaConsumerSASL(
      Config.kafkaSASLUsername,
      Config.kafkaSASLPassword,
      Config.kafkaBroker,
    );
    const dbConfig = {
      user: Config.postgresUsername,
      host: Config.postgresHost,
      database: Config.postgresDatabase,
      password: Config.postgresPassword,
      port: Config.postgresPort,
    };

    const db = new PostgresDB(dbConfig);
    const consumer = new KafkaConsumer(consumerSetup, Config.kafkaTopic, db);
    db.startConnection().then(() => {
      // eslint-disable-next-line no-console
      console.log(`🚂 Connected to postgresQL database.`);
    });
    consumer.startConsumer().then(() => {
      // eslint-disable-next-line no-console
      console.log(`🚂 Listening on port: ${port}`);
    });

    // SHUTDOWN
    function gracefulShutdown() {
      // eslint-disable-next-line no-console
      console.log('\n⚠️  Starting shutdown process...');
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log('\t🤞 Shutting down application');
        consumer.shutdown();
        // stop the server from accepting new connections
        server.close(function () {
          // eslint-disable-next-line no-console
          console.log('\t👋 All requests stopped, shutting down');
          // once the server is not accepting connections, exit
          process.exit();
        });
      }, 0);
    }

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }

  return server;
}

if (isCLI) {
  main();
}
