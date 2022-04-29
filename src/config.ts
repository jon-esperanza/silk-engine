export const Config = {
  port: parseInt(process.env.PORT || '8080'),
  kafkaTopic: process.env.KAFKA_TOPIC || '',
  kafkaBroker: process.env.KAFKA_BROKER || '',
  kafkaSASLUsername: process.env.KAFKA_SASL_USERNAME || '',
  kafkaSASLPassword: process.env.KAFKA_SASL_PASSWORD || '',

  // database
  postgresUsername: process.env.POSTGRES_USERNAME || '',
  postgresHost: process.env.POSTGRES_HOST || '',
  postgresDatabase: process.env.POSTGRES_DATABASE || '',
  postgresPassword: process.env.POSTGRES_PASSWORD || '',
  postgresPort: parseInt(process.env.POSTGRES_PORT || '5432'),

  // redis
  redisUrl: process.env.REDIS_URL || '',
  redisUsername: process.env.REDIS_USERNAME || '',
  redisPassword: process.env.REDIS_PASSWORD || '',
  redisHost: process.env.REDIS_HOST || '',
  redisPort: process.env.REDIS_PORT || '6380',

  // log
  logEnable: true,
};
