class ApiRateLimiter {
  constructor(limit = 10, windowSize = 1000) {
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
        capacity: this.capacity,
        tokens: this.capacity,
        lastRefill: Date.now(),
        lastRequest: Date.now(),
      });
    }
  }

  updateLoadFactor(activeRequests) {
    const normalizedRequests = Math.max(0, activeRequests);
    this.loadFactor = Math.min(1, normalizedRequests / this.maxAllowedRequests);
  }

  refillTokens(userId) {
    const bucket = this.buckets.get(userId);
    if (!bucket) return;

    const now = Date.now();
    const timePassed = now - bucket.lastRefill;

    // Calculate refill rate with minimum guarantee
    const refillRate = this.baseRate * Math.max(0.1, 1 - this.loadFactor);
    const tokensToAdd = refillRate * timePassed;

    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  handleRequest(userId) {
    this.initializeUserBucket(userId);
    const bucket = this.buckets.get(userId);

    this.refillTokens(userId);
    bucket.lastRequest = Date.now();

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
      // Remove buckets inactive for 24 hours
      if (now - bucket.lastRequest > 24 * 60 * 60 * 1000) {
        this.buckets.delete(userId);
      } else {
        // Reset tokens to capacity for active buckets
        bucket.tokens = bucket.capacity;
        bucket.lastRefill = now;
      }
    }
  }

  // Helper method to get bucket info (for testing/monitoring)
  getBucketInfo(userId) {
    return this.buckets.get(userId);
  }
}

module.exports = { ApiRateLimiter };
