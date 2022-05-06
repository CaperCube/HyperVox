# This doc outlines strategies for storing and retrieving accurate data to compensate for network latency

- Clients should store the last received server time-stamp
- Server should send all entity updates on the same tick / time-stamp
- Server time-stamps should be stored in an object with message emit times as the stamp names (up to the max allowed ping time, e.g. only store ~ 100 stamps if max allowed ping is 100)
- Each stamp object (on the server) should contain the message data the server sent to clients
- When a client sends a request that relies on position, the message should include the client's last received entity time-stamp (for effected entities). If no valid time-stamp is sent, the server should use its newest stamp.
- The server should then validate by checking the position of the entity at that time-stamp