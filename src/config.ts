export const Config = {
  port: parseInt(process.env.PORT || '8080'),
  kafkaTopic: process.env.KAFKA_TOPIC || '',
  kafkaBroker: process.env.KAFKA_BROKER || '',
  kafkaSASLUsername: process.env.KAFKA_SASL_USERNAME || '',
  kafkaSASLPassword: process.env.KAFKA_SASL_PASSWORD || '',
};
