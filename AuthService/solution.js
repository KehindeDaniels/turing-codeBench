class ApiRateLimiter {
  constructor() {
    this.buckets = new Map();
    this.capacity = 10;
    this.baseRate = 0.05; // tokens per millisecond
    this.refillInterval = 100; // milliseconds
    this.maxAllowedRequests = 1000;
    this.loadFactor = 0;
    this.lastCleanup = Date.now();
    this.cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Setup periodic cleanup
    setInterval(() => this.cleanupBuckets(), this.cleanupInterval);
  }

  initializeUserBucket(userId) {
    if (!this.buckets.has(userId)) {
      this.buckets.set(userId, {
        tokens: this.capacity,
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
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;

    if (timePassed >= this.refillInterval) {
      const refillRate = this.baseRate * (1 - this.loadFactor);
      const minimumRefillRate = this.baseRate * 0.1; // 10% of base rate
      const effectiveRate = Math.max(refillRate, minimumRefillRate);

      const tokensToAdd = effectiveRate * timePassed;
      bucket.tokens = Math.min(bucket.tokens + tokensToAdd, this.capacity);
      bucket.lastRefill = now;
    }
  }

  handleRequest(userId) {
    this.initializeUserBucket(userId);
    const bucket = this.buckets.get(userId);

    this.refillTokens(userId);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      bucket.lastRequest = Date.now();
      return { success: true };
    }

    return { success: false, message: "Rate limit exceeded. Try again later." };
  }

  cleanupBuckets() {
    const now = Date.now();
    for (const [userId, bucket] of this.buckets.entries()) {
      // Remove buckets that haven't been used in 24 hours
      if (now - bucket.lastRequest > this.cleanupInterval) {
        this.buckets.delete(userId);
      } else {
        // Reset tokens to capacity for active users
        bucket.tokens = this.capacity;
      }
    }
  }
}

module.exports = { ApiRateLimiter };
