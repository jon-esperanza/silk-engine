# insightQL
simple, portable stream processing engine.
<br> inspired by Robinhood's [Faust](https://faust.readthedocs.io/en/latest/introduction.html)

## Project vision

**Distributed**
<br>Simple integration into microservices because of the independence of each **insightQL** instance. Deploy as many as you need! 

**Read optimized**
<br>Designed to perform complex read queries, and is not designed to execute writes and updates to databases.

**Flexible**
<br>Freedom of creating multiple consumers and subscribing to as many topics as needed.

**Single instance**
<br>No need to distribute the preparation and execution of asynchronous jobs. This event processing engine assumes both roles.

**Precomputed**
<br>Contents of cache can be computed before it is needed.

**Clever caching**
<br>Executed queries are cached so that reads from this engine are served quickly. We have default in-memory key/value store but users can also integrate a redis configuration.

**Fresh data**
<br>Event-driven architecture allows the data in our cache to remain fresh and consistently synchronized as the data changes.

## Desired use cases
- Event processing
- Distributed joins & aggregations
- Asynchronous job execution
- Data denormalization
- Distributed computing

## Key highlights

**Centralized Message Data**
<br>InsightQL takes your data model to serialize the messages consumed by using a single instance of the data model provided. This greatly resembles the Singleton pattern.

<br> This single instance works well with our system because they are assigned one per agent. Each agent uses the data object as a centralized cache for all the messages the agent will consume. Our `CentralizedSingleInstance` type defines how our data objects work.
```typescript
export type CentralizedSingleInstance = {
  [keys: string]: any;

  /**
   * Helps ensure that this single instance is cleared and ready for the next message serialization.
   */
  clearInstance(): void;
  /**
   * Helps ensure that the message serialization was successful.
   * @returns boolean
   */
  validInstance(): boolean;
};
```


