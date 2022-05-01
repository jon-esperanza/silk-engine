import { EachMessagePayload, KafkaMessage } from 'kafkajs';
import Agent from '../kafka/models/agent.js';
import MessageData from '../kafka/models/messageData.js';

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

const agent = new Agent('mock-topic', 'testEvent', new Data(), async (messageData: Data): Promise<void> => {
  /* await app.db.set('order-id', message.orderid); */
  // use redis cache
});

let mockAgents = [agent];
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
    mockAgents.map(async agent => {
      // run async agents in parallel
      const validateSrc = agent.validateHeader ? message.headers : key;
      if (topic === agent.topic && validateSrc === agent.event && jsonData != undefined) {
        await agent.executeAgent(jsonData);
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
mockAgents = [agent, agent, agent, agent, agent];
let multipleAvg = 0;
for (let i = 0; i < 100; i++) {
  const start = performance.now();
  await coordinateMessage(mockMessage);
  const end = performance.now();
  const time = end - start;
  multipleAvg += time;
}

// eslint-disable-next-line no-console
console.log('event processing (1 agent, 1 job each):' + (singleAvg / 100).toFixed(3) + 'ms');
// eslint-disable-next-line no-console
console.log('event processing (5 agent(s), 1 job each):' + (multipleAvg / 100).toFixed(3) + 'ms');
