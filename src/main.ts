/**
 * example for how to use SilkEngine
 *  - create silkengine instance
 *  - subscribe engine to topics
 *  - define model to deserialize messages
 *  - define merchant and asynchronous job to execute
 *  - add merchant to engine workflow
 *  - start engine
 */
import Merchant from './kafka/models/Merchant.js';
import SilkEngine from './kafka/models/SilkEngine.js';
import MessageData from './kafka/models/MessageData.js';

// kafka consumer config
const engine = new SilkEngine({
  saslUsername: '',
  saslPassword: '',
  broker: '',
});
// subscribe to topics
engine.subscribe('topic-test');
// define data model to deserialize messages
class MarkedBook extends MessageData {
  bookId!: number;
  userId!: number;
  title!: string;
  author!: string;
  genre!: string;
  dateMarked!: string;
}
// create merchant to handle topic messages with data model and asynchronous job
const merchant = new Merchant('topic-test', '18', new MarkedBook(), async (messageData: MarkedBook): Promise<void> => {
  const prefix = `user:${messageData.userId}:markedBooks`;
  messageData.author = prefix;
});
// add merchant to engine
engine.addMerchant(merchant);

engine.start();
