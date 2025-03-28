const { ApiRateLimiter } = require("./solution");

describe("ApiRateLimiter Token Bucket Implementation", () => {
  let rateLimiter;

  beforeEach(() => {
    jest.useFakeTimers();
    rateLimiter = new ApiRateLimiter(10, 1000);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("Bucket Initialization", () => {
    it("should initialize a new bucket with capacity 10, and deduct one token if a request is initially made", () => {
      const userId = "user1";
      rateLimiter.handleRequest(userId, 0);
      const bucket = rateLimiter.buckets.get(userId);
      expect(bucket).toBeDefined();
      expect(bucket.capacity).toBe(10);
      // Since a request deducts one token, tokens should be 9
      expect(bucket.tokens).toBe(9);
      expect(bucket.lastRefill).toBeGreaterThan(0);
    });

    it("should not reinitialize an existing bucket", () => {
      const userId = "user2";
      rateLimiter.handleRequest(userId, 0);
      const firstBucket = rateLimiter.buckets.get(userId);
      // Wait 50ms then call handleRequest again
      jest.advanceTimersByTime(50);
      rateLimiter.handleRequest(userId, 0);
      const secondBucket = rateLimiter.buckets.get(userId);
      expect(secondBucket).toBe(firstBucket);
    });
  });

  describe("updateLoadFactor", () => {
    it("should update the global loadFactor based on activeRequests", () => {
      rateLimiter.updateLoadFactor(500);
      expect(rateLimiter.loadFactor).toBeCloseTo(0.5);
      rateLimiter.updateLoadFactor(1500);
      expect(rateLimiter.loadFactor).toBe(1); // which is capped at 1
    });
  });

  describe("refillTokens", () => {
    it("should refill tokens correctly when loadFactor is 0", () => {
      const userId = "user3";
      // Initializing the bucket by processing a request
      rateLimiter.handleRequest(userId, 0);
      // after 6 requests, tokens should be 10 - 6 = 4.
      for (let i = 0; i < 5; i++) {
        rateLimiter.handleRequest(userId, 0);
      }
      let bucket = rateLimiter.buckets.get(userId);
      expect(bucket.tokens).toBe(4);

      // Set loadFactor to 0 so refillRate = baseRate = 0.05 tokens/ms.
      rateLimiter.updateLoadFactor(0);
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      bucket = rateLimiter.buckets.get(userId);
      // Expected refill will be 100ms * 0.05 = 5 tokens; new tokens = min(10, 4 + 5) = 9.
      expect(bucket.tokens).toBeCloseTo(9);
    });

    it("should never exceed bucket capacity on refill", () => {
      const userId = "user4";
      rateLimiter.handleRequest(userId, 0);
      // Do not deduct any additional tokens even after a long time, tokens should remain at capacity
      rateLimiter.updateLoadFactor(0);
      jest.advanceTimersByTime(1000);
      rateLimiter.refillTokens(userId);
      const bucket = rateLimiter.buckets.get(userId);
      expect(bucket.tokens).toBeLessThanOrEqual(bucket.capacity);
    });

    it("should use minimum refill rate when loadFactor is 1", () => {
      const userId = "user5";
      // Initialize and then deduct tokens so that tokens are reduced
      rateLimiter.handleRequest(userId, 0); // bucket is now at 9 tokens
      for (let i = 0; i < 8; i++) {
        rateLimiter.handleRequest(userId, 0);
      }
      let bucket = rateLimiter.buckets.get(userId);
      // After 9 requests total, tokens should be 10 - 9 = 1.
      expect(bucket.tokens).toBe(1);

      // Set loadFactor to 1 (simulate heavy load)
      rateLimiter.updateLoadFactor(1000);
      // Minimum refill rate = 10% of baseRate = 0.005 tokens/ms.
      // for advance time by 100 ms, the expected refill will be 100 * 0.005 = 0.5 tokens.
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      bucket = rateLimiter.buckets.get(userId);
      expect(bucket.tokens).toBeCloseTo(1 + 0.5);
    });

    it("should provide refilled tokens to a request arriving exactly at refill time", () => {
      const userId = "user6";
      // Drain the bucket.
      for (let i = 0; i < 10; i++) {
        rateLimiter.handleRequest(userId, 0);
      }
      let bucket = rateLimiter.buckets.get(userId);
      // Expect bucket to have insufficient tokens (likely 0 or near 0)
      expect(bucket.tokens).toBeLessThan(1);

      rateLimiter.updateLoadFactor(0);
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      // Now a new request should see the refilled tokens
      bucket = rateLimiter.buckets.get(userId);
      expect(bucket.tokens).toBeGreaterThanOrEqual(1);
    });
  });

  describe("handleRequest", () => {
    it("should allow a request when tokens are available and deduct one token", () => {
      const userId = "user7";
      rateLimiter.updateLoadFactor(0);
      const response = rateLimiter.handleRequest(userId, 0);
      expect(response.success).toBe(true);
      const bucket = rateLimiter.buckets.get(userId);
      expect(bucket.tokens).toBe(9); // one token deducted from the initial 10
    });

    it("should reject a request when no tokens remain", () => {
      const userId = "user8";
      rateLimiter.updateLoadFactor(0);
      // Consume all tokens.
      for (let i = 0; i < 10; i++) {
        rateLimiter.handleRequest(userId, 0);
      }
      const response = rateLimiter.handleRequest(userId, 0);
      expect(response.success).toBe(false);
      expect(response.message).toBe("Rate limit exceeded. Try again later.");
    });

    it("should process multiple (concurrent) requests atomically", async () => {
      const userId = "user9";
      rateLimiter.updateLoadFactor(0);
      // Simulate several simultaneous requests
      const requestPromises = [];
      for (let i = 0; i < 10; i++) {
        requestPromises.push(
          Promise.resolve(rateLimiter.handleRequest(userId, 0))
        );
      }
      const responses = await Promise.all(requestPromises);
      responses.forEach((res) => expect(res.success).toBe(true));
      const bucket = rateLimiter.buckets.get(userId);
      expect(bucket.tokens).toBe(0);
      // but an extra request should fail
      const extra = rateLimiter.handleRequest(userId, 0);
      expect(extra.success).toBe(false);
    });

    it("should update loadFactor immediately before processing each request", () => {
      const userId = "user10";
      // First, for a high load.
      rateLimiter.updateLoadFactor(800);
      const resHighLoad = rateLimiter.handleRequest(userId, 800);
      expect(resHighLoad.success).toBe(true);
      let bucket = rateLimiter.buckets.get(userId);
      expect(bucket.tokens).toBe(9);
      // Then update loadFactor to a low value and process another request
      rateLimiter.updateLoadFactor(0);
      const resLowLoad = rateLimiter.handleRequest(userId, 0);
      expect(resLowLoad.success).toBe(true);
    });
  });

  describe("Reset Functionality", () => {
    it("should clear the bucket for inactive users after 24 hours", () => {
      const userId = "user11";
      rateLimiter.handleRequest(userId, 0);
      jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
      rateLimiter.resetStaleBuckets();
      expect(rateLimiter.buckets.has(userId)).toBe(false);
    });

    it("should reset tokens to capacity for active users after 24 hours", () => {
      const userId = "user12";
      rateLimiter.handleRequest(userId, 0);
      for (let i = 0; i < 5; i++) {
        rateLimiter.handleRequest(userId, 0);
      }
      let bucket = rateLimiter.buckets.get(userId);
      expect(bucket.tokens).toBeLessThan(bucket.capacity);
      bucket.lastRefill = Date.now();
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      rateLimiter.resetStaleBuckets();
      bucket = rateLimiter.buckets.get(userId);
      expect(bucket).toBeDefined();
      expect(bucket.tokens).toBe(bucket.capacity);
    });
  });

  describe("Handling some Edge Cases", () => {
    it("should immediately reflect a new load factor for token refilling", () => {
      const userId = "userEdge1";
      rateLimiter.handleRequest(userId, 0);
      rateLimiter.handleRequest(userId, 0);
      let bucket = rateLimiter.buckets.get(userId);
      expect(bucket.tokens).toBe(8);
      rateLimiter.updateLoadFactor(0);
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      bucket = rateLimiter.buckets.get(userId);
      expect(bucket.tokens).toBe(10);

      // Deduct one token; tokens become 9.
      rateLimiter.handleRequest(userId, 0);
      rateLimiter.updateLoadFactor(1000);
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      bucket = rateLimiter.buckets.get(userId);

      // Under loadFactor 1, minimum refill rate = 0.005 tokens/ms, so refill = 0.5 tokens
      // Expected tokens = 9 + 0.5 = 9.5.
      expect(bucket.tokens).toBeCloseTo(9.5);
    });

    it("should treat negative activeRequests as 0 load", () => {
      rateLimiter.updateLoadFactor(-100);
      expect(rateLimiter.loadFactor).toBe(0);
    });

    it("should apply different refill rates consecutively when load factor changes", () => {
      const userId = "userEdge2";
      // Start with a request to initialize the bucket then tokens = 9 after deduction
      rateLimiter.handleRequest(userId, 0);
      let bucket = rateLimiter.buckets.get(userId);

      // Setting the loadFactor = 0 and advance time by 100ms.
      rateLimiter.updateLoadFactor(0);
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      bucket = rateLimiter.buckets.get(userId);
      // Under loadFactor 0, refill = 5 tokens, tokens = min(10, 9+5) = 10.
      expect(bucket.tokens).toBe(10);

      // Deduct one token for a request, so tokens will become 9.
      rateLimiter.handleRequest(userId, 0);
      // Now set loadFactor = 0.8, which should result in a lower refill rate
      // the refillRate = 0.05 * Math.max(0.1, 1 - 0.8) = 0.05 * 0.2 = 0.01 tokens/ms
      // Over 100ms, expected refill = 1 token; tokens become 9 + 1 = 10
      rateLimiter.updateLoadFactor(800); // loadFactor = 0.8
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      bucket = rateLimiter.buckets.get(userId);
      expect(bucket.tokens).toBe(10);
    });
  });
});
