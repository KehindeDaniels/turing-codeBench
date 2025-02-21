// ApiRateLimiter.test.js
const { ApiRateLimiter } = require("./ApiRateLimiter");

describe("ApiRateLimiter Token Bucket Implementation", () => {
  let rateLimiter;

  beforeEach(() => {
    // Use fake timers to simulate time-based operations
    jest.useFakeTimers();
    // Create a new instance.
    // (Assuming the constructor still accepts the two parameters, though they may not be used in the new logic.)
    rateLimiter = new ApiRateLimiter(10, 1000);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("Bucket Initialization", () => {
    it("should initialize a new bucket with capacity 10, tokens = capacity, and a valid lastRefill timestamp", () => {
      const userId = "user1";
      // Trigger a request (which must call initializeUserBucket internally)
      rateLimiter.handleRequest(userId, 0);
      const bucket = rateLimiter.requests.get(userId);
      expect(bucket).toBeDefined();
      expect(bucket.capacity).toBe(10);
      expect(bucket.tokens).toBe(10);
      expect(bucket.lastRefill).toBeGreaterThan(0);
    });

    it("should not reinitialize an existing bucket", () => {
      const userId = "user2";
      rateLimiter.handleRequest(userId, 0);
      const firstBucket = rateLimiter.requests.get(userId);
      // wait 50ms and call handleRequest again
      jest.advanceTimersByTime(50);
      rateLimiter.handleRequest(userId, 0);
      const secondBucket = rateLimiter.requests.get(userId);
      expect(secondBucket).toBe(firstBucket);
    });
  });

  describe("updateLoadFactor", () => {
    it("should update the global loadFactor based on activeRequests", () => {
      rateLimiter.updateLoadFactor(500);
      expect(rateLimiter.loadFactor).toBeCloseTo(0.5);
      rateLimiter.updateLoadFactor(1500);
      expect(rateLimiter.loadFactor).toBe(1); // capped at 1
    });
  });

  describe("refillTokens", () => {
    it("should refill tokens correctly when loadFactor is 0", () => {
      const userId = "user3";
      // Initialize the bucket by processing a request
      rateLimiter.handleRequest(userId, 0);
      // Deduct a few tokens
      for (let i = 0; i < 5; i++) {
        rateLimiter.handleRequest(userId, 0);
      }
      let bucket = rateLimiter.requests.get(userId);
      // After 6 requests, tokens should be 10 - 6 = 4.
      expect(bucket.tokens).toBe(4);

      // Set loadFactor to 0 so refillRate = baseRate = 0.05 tokens/ms.
      rateLimiter.updateLoadFactor(0);
      // Advance time by 100 ms.
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      bucket = rateLimiter.requests.get(userId);
      // Expected refill = 100ms * 0.05 = 5 tokens, so tokens become min(10, 4 + 5) = 9.
      expect(bucket.tokens).toBeCloseTo(9);
    });

    it("should never exceed bucket capacity on refill", () => {
      const userId = "user4";
      rateLimiter.handleRequest(userId, 0);
      // Do not deduct any tokens; even after a long time, tokens should remain at capacity.
      rateLimiter.updateLoadFactor(0);
      jest.advanceTimersByTime(1000);
      rateLimiter.refillTokens(userId);
      const bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBeLessThanOrEqual(bucket.capacity);
    });

    it("should use minimum refill rate when loadFactor is 1", () => {
      const userId = "user5";
      // Initialize and then deduct tokens so that tokens are reduced.
      rateLimiter.handleRequest(userId, 0); // bucket now at 9 tokens
      for (let i = 0; i < 8; i++) {
        rateLimiter.handleRequest(userId, 0);
      }
      let bucket = rateLimiter.requests.get(userId);
      // After 9 requests total, tokens should be 10 - 9 = 1.
      expect(bucket.tokens).toBe(1);

      // Set loadFactor to 1 (simulate heavy load)
      rateLimiter.updateLoadFactor(1000);
      // Minimum refill rate = 10% of baseRate = 0.005 tokens/ms.
      // Advance time by 100 ms => expected refill = 100 * 0.005 = 0.5 tokens.
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBeCloseTo(1 + 0.5);
    });

    it("should provide refilled tokens to a request arriving exactly at refill time", () => {
      const userId = "user6";
      // Drain the bucket.
      for (let i = 0; i < 10; i++) {
        rateLimiter.handleRequest(userId, 0);
      }
      let bucket = rateLimiter.requests.get(userId);
      // Expect bucket to have insufficient tokens (likely 0 or near 0).
      expect(bucket.tokens).toBeLessThan(1);

      // Set loadFactor low for a full refill amount.
      rateLimiter.updateLoadFactor(0);
      // Advance time exactly 100 ms.
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      // Now a new request should see the refilled tokens.
      bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBeGreaterThanOrEqual(1);
    });
  });

  describe("handleRequest", () => {
    it("should allow a request when tokens are available and deduct one token", () => {
      const userId = "user7";
      rateLimiter.updateLoadFactor(0);
      const response = rateLimiter.handleRequest(userId, 0);
      expect(response.success).toBe(true);
      const bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBe(9); // one token was deducted from the initial 10
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
      // Simulate several simultaneous requests.
      const requestPromises = [];
      for (let i = 0; i < 10; i++) {
        requestPromises.push(
          Promise.resolve(rateLimiter.handleRequest(userId, 0))
        );
      }
      const responses = await Promise.all(requestPromises);
      // All 10 requests should succeed.
      responses.forEach((res) => expect(res.success).toBe(true));
      const bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBe(0);
      // An extra request should fail.
      const extra = rateLimiter.handleRequest(userId, 0);
      expect(extra.success).toBe(false);
    });

    it("should update loadFactor immediately before processing each request", () => {
      const userId = "user10";
      // First, simulate a high load
      rateLimiter.updateLoadFactor(800);
      const resHighLoad = rateLimiter.handleRequest(userId, 800);
      expect(resHighLoad.success).toBe(true);
      let bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBe(9);
      // Then update loadFactor to a low value and process another request.
      rateLimiter.updateLoadFactor(0);
      const resLowLoad = rateLimiter.handleRequest(userId, 0);
      expect(resLowLoad.success).toBe(true);
    });
  });

  describe("Reset Functionality", () => {
    it("should clear the bucket for inactive users after 24 hours", () => {
      const userId = "user11";
      // Initialize a bucket by making a request.
      rateLimiter.handleRequest(userId, 0);
      // Simulate no activity by advancing time by 24 hours (86,400,000 ms).
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      // Assume the internal reset routine (setInterval) has run.
      // (If the implementation exposes a resetBuckets() method for testing, you can call it here.)
      expect(rateLimiter.requests.has(userId)).toBe(false);
    });

    it("should reset tokens to capacity for active users after 24 hours", () => {
      const userId = "user12";
      // Active user: initialize and consume some tokens.
      rateLimiter.handleRequest(userId, 0);
      for (let i = 0; i < 5; i++) {
        rateLimiter.handleRequest(userId, 0);
      }
      let bucket = rateLimiter.requests.get(userId);
      // Expect tokens to be less than capacity.
      expect(bucket.tokens).toBeLessThan(bucket.capacity);
      // Mark the bucket as active by updating its lastRefill timestamp.
      bucket.lastRefill = Date.now();
      // Advance time by 24 hours.
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      // After reset, active users keep their bucket but tokens are reset to capacity.
      bucket = rateLimiter.requests.get(userId);
      expect(bucket).toBeDefined();
      expect(bucket.tokens).toBe(bucket.capacity);
    });
  });
});
