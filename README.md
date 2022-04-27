# insightQL

## Characteristics
 - easily integrated query engine for server (backend) or client (frontend) services. It integrates just as any other microservice would, independently (stateless). Makes it simple to implement complex database queries into applications. 
 - designed to perform queries over large segments of data, and is not designed for point reads and updates of single rows of data. 
 - adaptive not only to different query characteristics, but also combinations of characteristics. Without adaptiveness, it would be necessary to narrowly partition workloads and tune configuration for each workload independently.
 - can complete the "distributed work" as a single instance, no need for coordinator and worker nodes. This query engine assumes both roles.
