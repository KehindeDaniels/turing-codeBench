class ApiRateLimiter {
  constructor() {
    this.capacity = 10; // default capacity per user
    this.baseRate = 0.05; // base refill rate per millisecond
    this.minRefillRate = this.baseRate * 0.1; // minimum refill rate (10% of baseRate)
    this.windowSize = 100; // refill tokens every 100 milliseconds
    this.maxAllowedRequests = 1000; // maximum requests the system can handle
    this.loadFactor = 0; // initial load factor
    this.buckets = new Map(); // in-memory storage for user token data

    // reset stale buckets every 24 hours
    setInterval(() => this.resetStaleBuckets(), 24 * 60 * 60 * 1000);
  }

  initializeUserBucket(userId) {
    if (!this.buckets.has(userId)) {
      this.buckets.set(userId, {
        capacity: this.capacity,
        tokens: this.capacity,
        lastRefill: Date.now(),
      });
    }
  }

  updateLoadFactor(activeRequests) {
    this.loadFactor = Math.min(
      1,
      Math.max(0, activeRequests / this.maxAllowedRequests)
    );
  }

  refillTokens(userId) {
    const now = Date.now();
    const bucket = this.buckets.get(userId);
    const refillRate = Math.max(
      this.minRefillRate,
      this.baseRate * (1 - this.loadFactor)
    );
    const tokensToRefill =
      Math.floor((now - bucket.lastRefill) / this.windowSize) * refillRate;
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToRefill);
    bucket.lastRefill = now;
    this.buckets.set(userId, bucket);
  }

  handleRequest(userId, activeRequests) {
    this.initializeUserBucket(userId);
    this.updateLoadFactor(activeRequests);
    this.refillTokens(userId);
    const bucket = this.buckets.get(userId);
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.buckets.set(userId, bucket);
      return { success: true };
    } else {
      return {
        success: false,
        message: "Rate limit exceeded. Try again later.",
      };
    }
  }

  resetStaleBuckets() {
    const now = Date.now();
    this.buckets.forEach((bucket, userId) => {
      if (now - bucket.lastRefill > 24 * 60 * 60 * 1000) {
        this.buckets.delete(userId);
      } else {
        bucket.tokens = bucket.capacity;
        this.buckets.set(userId, bucket);
      }
    });
  }
}

module.exports = { ApiRateLimiter };
