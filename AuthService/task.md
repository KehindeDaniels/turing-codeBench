Base Code
````javascript
class ApiRateLimiter {
  constructor(limit, windowSize) {
    // limit: allowed requests per window; windowSize: duration in milliseconds
    this.limit = limit;
    this.windowSize = windowSize;
    this.requests = new Map();
  }

  isAllowed(userId) {
    const now = Date.now();
    if (!this.requests.has(userId)) {
      this.requests.set(userId, []);
    }
    const timestamps = this.requests.get(userId);
    // Remove requests older than windowSize
    const recent = timestamps.filter(ts => now - ts < this.windowSize);
    if (recent.length >= this.limit) {
      return { success: false, message: 'Rate limit exceeded. Try again later.' };
    }
    recent.push(now);
    this.requests.set(userId, recent);
    return { success: true };
  }
}

module.exports = {ApiRateLimiter};

````

Prompt
Please help me enhanc this API rate-limiting system help replace the fixed window approach with to use a token bucket algorithm that dynamically adjusts request limits based on system load.
These are the things I want you to do

1. Token bucket Implementation
- Replace the fixed window approach to a token bucket algorithm
- Now, each user’s token bucket should have 
a. a capacity and type integer, with the max tokens allowed for each user as default to 10 tokens
b. tokens, current number of available tokens which should be initially set to capacity
b. the lastRefill (timestamp in milliseconds)The last time tokens were refilled.
- When a new user makes a request, call initializeUserBucket(userId) if a bucket does not already exist.
- If a bucket already exists, do not reinitialize it, just proceed to the refill process

2. The refilling mechanism
- Tokens should refill every 100 milliseconds using this formular `refillRate = baseRate * (1 - loadFactor)`
where the baseRate is 0.05 tokens per millisecond, the loadFactor is the system load percentage which is a value between 0 and 1, capped at 1
- If loadFactor is 1, use a minimum refill rate of 10% of baseRate to prevent complete blockage
- Refill tokens only up to capacity but never exceed max token
- All time calculations must be in miliseconds
-  for edge timing,  If a request arrives exactly when tokens should be refilled, the newly added tokens must be available for that request `refillTokens(userId)`

 3. The dynamic throttling based on system load
- Introduce a global `loadFactor` that wil adjust refill rate dynamically
- The system load should be calculated as `loadFactor = activeRequests / maxAllowedRequests`
where the `activeRequests` = Number of ongoing API requests and `maxAllowedRequests` = 1000 (maximum requests the system can handle)
- Cap `loadFactor` at 1 if `activeRequests` exceeds `maxAllowedRequests`, set `oadFactor = 1`
- If there is a change in loadFactor, the refillRate must be updated immediately before each refill operation. After calling updateLoadFactor, all subsequent calls to refillTokens(userId) must use the most recent loadFactor value to determine the refill amount, ensuring real-time adjustments in token replenishment
- Now, I want you to Implement an `updateLoadFactor(activeRequests)` to calculate the loadFactor as activeRequests divided by maxAllowedRequests (capped at 1). This function must be called externally by a dedicated monitoring component before processing requests, ensuring that the global loadFactor is updated dynamically

4. Request Handling
When a request is made using `handleRequest(userId)`
- Call initializeUserBucket(userId) if the user's token bucket does not already exist.
- Call updateLoadFactor(activeRequests) to update the global loadFactor.
- Call refillTokens(userId) to update the token count.
- and If tokens is greater or equal to 1, allow the request and deduct 1 token
- if tokens < 1 then return `{ "success": false, "message": "Rate limit exceeded. Try again later." }`
- A request arriving exactly at a refill time should get the refilled tokens
- Requests must fail if no tokens remain
- The token deduction must happen atomically to avoid concurrency issues

5. For error handling and some edge cases
- If a user's bucket is empty, return an error message like this `{ success: false, message: "Rate limit exceeded. Try again later." }`
- Ensure that each user’s token bucket operates independently
- make sure to validate that a request arriving exactly at the moment of token refill is handled correctly.
- Verify that dynamic changes in loadFactor immediately affect token refill rates.
- For an asynchronous environment, ensure that token bucket updates happen one at a time to prevent conflicts when multiple requests try to modify the same user's token data simultaneously

6. Storage and reset 
- Store user token data in-memory using a Map
- Reset all token buckets every 24 hours to prevent stale data buildup. - 
- Implement this using setInterval()
- Reset should only clear unused buckets (users with no recent requests)
- Active users should keep their bucket, but tokens should reset to capacity

Note: Please don't change the naming convention and named export format 