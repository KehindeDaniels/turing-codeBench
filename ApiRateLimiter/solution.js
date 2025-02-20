class ApiRateLimiter {
  constructor(limit = 10, windowSize = 1000) {
    this.buckets = new Map();
    this.capacity = limit;
    this.baseRate = 0.05; // tokens per millisecond
    this.refillInterval = 100; // milliseconds
    this.maxAllowedRequests = 1000;
    this.loadFactor = 0;

    // Reset buckets every 24 hours
    setInterval(() => {
      this.buckets.clear();
    }, 24 * 60 * 60 * 1000);
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
    this.loadFactor = Math.min(activeRequests / this.maxAllowedRequests, 1);
    return this.loadFactor;
  }

  refillTokens(userId) {
    const bucket = this.buckets.get(userId);
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;

    if (timePassed >= this.refillInterval) {
      const refillRate = this.baseRate * Math.max(0.1, 1 - this.loadFactor);
      const tokensToAdd = refillRate * timePassed;

      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  handleRequest(userId) {
    this.initializeUserBucket(userId);
    this.refillTokens(userId);

    const bucket = this.buckets.get(userId);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { success: true };
    }

    return {
      success: false,
      message: "Rate limit exceeded. Try again later.",
    };
  }

  // Method to get current bucket state (for testing/monitoring)
  getBucketState(userId) {
    return this.buckets.get(userId);
  }

  // Method to get current load factor (for testing/monitoring)
  getCurrentLoadFactor() {
    return this.loadFactor;
  }
}

module.exports = ApiRateLimiter;
