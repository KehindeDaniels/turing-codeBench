Explanaton to the udates

1. Bucket Initialization
In `initializeUserBucket`, a bucket is created with all the required properties 
- capacity,
- tokens, 
- lastRefill, 
- and lastRequest

2. Load Factor
`updateLoadFactor` now defaults activeRequests to 0 if not provided, to make sure the load factor is always a valid number between 0 and 1

3. Token Refill
In refillTokens, it first check if the bucket exists. Then it computes the elapsed time and calculate the effective refill rate using
```javascript
Math.max(this.minRefillRate, this.baseRate * (1 - this.loadFactor))
```
This makes sure that even at high load (loadFactor = 1) a minimum refill rate is used

4. Request Handling
`handleRequest` ensures the bucket is initialized, updates the load factor and refills tokens, then deducts one token if available, and also updates lastRequest to mark user activity

The ideal response meets the task requirements by
- Correctly initializing buckets with all necessary properties,
- Handling missing buckets in refillTokens
- Updating the global load factor safely,
- Refilling tokens continuously with a minimum refill rate, and
Resetting stale buckets based on user activity.



