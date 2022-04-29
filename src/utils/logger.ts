import pino from 'pino';
import pinoms from 'pino-multi-stream';
import { Config } from '../config.js';

const streams: pinoms.Streams = [
  { stream: process.stdout },
  { level: 'error', stream: pino.destination(`src/logs/error.log`) },
];

// only write errors to log if logging is disabled
const logDisableStreams: pinoms.Streams = [{ level: 'error', stream: pino.destination(`src/logs/error.log`) }];

export const logger = pinoms({
  formatters: {
    level: label => {
      return { level: label };
    },
  },
  streams: Config.logEnable ? streams : logDisableStreams,
  customLevels: {
    kafka: 35,
    redis: 36,
  },
  base: undefined,
});
