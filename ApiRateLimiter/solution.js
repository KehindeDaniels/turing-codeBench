class ApiRateLimiter {
  constructor(limit = 10, windowSize = 1000) {
    this.maxCapacity = limit;
    this.windowSize = windowSize;
    this.buckets = new Map();
    this.baseRate = 0.05; // tokens per millisecond
    this.maxAllowedRequests = 1000;
    this.loadFactor = 0;

    // Reset stale buckets every 24 hours
    setInterval(() => this.resetStaleBuckets(), 24 * 60 * 60 * 1000);
  }

  initializeUserBucket(userId) {
    if (!this.buckets.has(userId)) {
      this.buckets.set(userId, {
        capacity: this.maxCapacity,
        tokens: this.maxCapacity,
        lastRefill: Date.now(),
        lastRequest: Date.now(),
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

    // Calculate refill rate with minimum guarantee
    const refillRate = this.baseRate * Math.max(0.1, 1 - this.loadFactor);
    const tokensToAdd = refillRate * timePassed;

    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  handleRequest(userId) {
    this.initializeUserBucket(userId);
    this.refillTokens(userId);

    const bucket = this.buckets.get(userId);
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
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours

    for (const [userId, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRequest > staleThreshold) {
        this.buckets.delete(userId);
      } else {
        bucket.tokens = bucket.capacity;
      }
    }
  }
}

module.exports = { ApiRateLimiter };
