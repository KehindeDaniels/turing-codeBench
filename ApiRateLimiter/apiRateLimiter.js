class ApiRateLimiter {
  constructor(limit = 10, windowSize = 100) {
    this.capacity = limit;
    this.windowSize = windowSize;
    this.buckets = new Map();
    this.baseRate = 0.05; // tokens per millisecond
    this.loadFactor = 0;
    this.maxAllowedRequests = 1000;

    // Reset stale buckets every 24 hours
    setInterval(() => this.resetStaleBuckets(), 24 * 60 * 60 * 1000);
  }

  initializeUserBucket(userId) {
    if (!this.buckets.has(userId)) {
      this.buckets.set(userId, {
        tokens: this.capacity,
        lastRefill: Date.now(),
        capacity: this.capacity,
      });
    }
  }

  updateLoadFactor(activeRequests) {
    this.loadFactor = Math.min(activeRequests / this.maxAllowedRequests, 1);
  }

  refillTokens(userId) {
    const bucket = this.buckets.get(userId);
    if (!bucket) return;

    const now = Date.now();
    const timePassed = now - bucket.lastRefill;

    // Calculate refill rate with minimum threshold
    const refillRate = this.baseRate * Math.max(0.1, 1 - this.loadFactor);
    const tokensToAdd = refillRate * timePassed;

    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
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

  resetStaleBuckets() {
    const now = Date.now();
    for (const [userId, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > 24 * 60 * 60 * 1000) {
        // Remove buckets with no activity in last 24 hours
        this.buckets.delete(userId);
      } else {
        // Reset tokens to capacity for active buckets
        bucket.tokens = bucket.capacity;
      }
    }
  }

  // Helper method to get current bucket state (for testing/monitoring)
  getBucketState(userId) {
    return this.buckets.get(userId);
  }
}

module.exports = { ApiRateLimiter };
