import { EachMessagePayload, KafkaMessage } from 'kafkajs';
import Merchant from '../kafka/models/Merchant.js';
import MessageData from '../kafka/models/MessageData.js';

class Data extends MessageData {
  ordertime!: number;
  orderid!: number;
  orderida!: number;
  orderids!: number;
  orderidd!: number;
  orderidf!: number;
  orderidg!: number;
  orderidh!: number;
  orderidj!: number;
  orderidk!: number;
}

const merchant = new Merchant('mock-topic', 'testEvent', new Data(), async (messageData: Data): Promise<void> => {
  /* await app.db.set('order-id', message.orderid); */
  // use redis cache
});

let mockMerchants = [merchant];
const mockMessage: EachMessagePayload = {
  topic: 'mock-topic',
  partition: 4,
  message: {
    key: Buffer.from('testEvent'),
    value: Buffer.from(
      '{"orderid": 18, "ordertime": 23, "orderida": 1, "orderids": 1, "orderidd": 1, "orderidf": 1, "orderidg": 1, "orderidh": 1, "orderidj": 1, "orderidk": 1}',
    ),
    timestamp: '202023920',
    size: 12,
    attributes: 1,
    offset: '60',
  } as KafkaMessage,
  heartbeat: async () => {},
};

let singleAvg = 0;

async function coordinateMessage(messagePayload: EachMessagePayload): Promise<void> {
  const { topic, partition, message } = messagePayload;
  const jsonData = JSON.parse(String(message.value)); // message.value into generic object
  const key = String(message.key);
  await Promise.all(
    mockMerchants.map(async merchant => {
      // run async merchants in parallel
      const validateSrc = merchant.validateHeader ? message.headers : key;
      if (topic === merchant.topic && validateSrc === merchant.event && jsonData != undefined) {
        await merchant.execute(jsonData);
      }
    }),
  );
}

for (let i = 0; i < 100; i++) {
  const start = performance.now();
  await coordinateMessage(mockMessage);
  const end = performance.now();
  const time = end - start;
  singleAvg += time;
}
mockMerchants = [merchant, merchant, merchant, merchant, merchant];
let multipleAvg = 0;
for (let i = 0; i < 100; i++) {
  const start = performance.now();
  await coordinateMessage(mockMessage);
  const end = performance.now();
  const time = end - start;
  multipleAvg += time;
}

// eslint-disable-next-line no-console
console.log('event processing (1 merchant, 1 job each):' + (singleAvg / 100).toFixed(3) + 'ms');
// eslint-disable-next-line no-console
console.log('event processing (5 merchants, 1 job each):' + (multipleAvg / 100).toFixed(3) + 'ms');
