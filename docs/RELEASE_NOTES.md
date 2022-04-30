# VERSION 1.0.1
 - Set up project with Kafka and PostgresQL integration config.
 - Modularized objects and types. Implemented abstraction for app configuring, data defining, and initializing.
 - Implemented storage. In-memory key/value store available by default. Optional **redis** configuration also integrated.
 - Proper usage of running async functions from within loops. Optimization to message coordination process. Started benchmarking.