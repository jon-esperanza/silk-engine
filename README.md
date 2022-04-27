# insightQL
simple, portable stream processing engine.
<br> inspired by Robinhood's [Faust](https://faust.readthedocs.io/en/latest/introduction.html)

## Project vision

**Independent**
<br>Simple and stateless integration into microservices. 

**Read optimized**
<br>Designed to perform complex read queries, and is not designed to execute writes and updates to databases.

**Flexible**
<br>Freedom of complex queries and configuration with any database.

**Single instance**
<br>No need to distribute the preparation and execution of queries. This query engine assumes both roles.

**Precomputed**
<br>Contents of cache are computed before it is needed.

**Clever caching**
<br>Executed queries are cached so that reads from this query engine are served quickly. Sequential event consumption allows cache invalidation

**Fresh data**
<br>Event-driven architecture allows the data in our cache to remain fresh and consistently synchronized as the data changes.

## Desired use cases
- Event processing
- Distributed joins & aggregations
- Asynchronous job execution
- Data denormalization
- Distributed computing
