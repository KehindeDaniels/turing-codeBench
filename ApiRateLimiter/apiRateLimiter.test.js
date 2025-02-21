// ApiRateLimiter.test.js
const { ApiRateLimiter } = require("./solution");

describe("ApiRateLimiter - Token Bucket Implementation", () => {
  let rateLimiter;
  const capacity = 10;
  const windowSize = 100; // Base window for refill timing (ms)
  const baseRate = 0.05; // tokens per millisecond
  const maxAllowedRequests = 1000; // For dynamic load factor

  beforeEach(() => {
    jest.useFakeTimers();
    // Instantiate a new instance for each test.
    // Some tests (from Test 1) rely on passing parameters.
    rateLimiter = new ApiRateLimiter(capacity, windowSize);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ------------------------------------------------------------------------------------
  // Bucket Initialization & Basic Checks (Merged)
  // ------------------------------------------------------------------------------------
  describe("User Bucket Initialization", () => {
    it("should initialize a new user's bucket with full capacity and set lastRefill", () => {
      const userId = "user1";
      // Update load factor and trigger request which should initialize the bucket
      rateLimiter.updateLoadFactor(0);
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(true);

      const bucket = rateLimiter.requests.get(userId);
      expect(bucket).toBeDefined();
      // Test 1 expects a bucket property "capacity"
      expect(bucket.capacity).toBe(capacity);
      // One token is deducted by the handleRequest call:
      expect(bucket.tokens).toBe(capacity - 1);
      expect(typeof bucket.lastRefill).toBe("number");
    });

    it("should not reinitialize a bucket if it already exists", () => {
      const userId = "user2";
      rateLimiter.updateLoadFactor(0);
      // First request initializes the bucket
      rateLimiter.handleRequest(userId);
      const bucketBefore = rateLimiter.requests.get(userId);

      // Advance time and make another request
      jest.advanceTimersByTime(50);
      rateLimiter.handleRequest(userId);
      const bucketAfter = rateLimiter.requests.get(userId);

      // The bucket object should retain its capacity (only tokens/lastRefill updated)
      expect(bucketAfter.capacity).toBe(bucketBefore.capacity);
    });

    // Additional check from Test 2 for double initialization
    it("initializeUserBucket() called twice should NOT reinitialize if bucket already exists", () => {
      rateLimiter.initializeUserBucket("userA");
      // Drain some tokens
      for (let i = 0; i < 5; i++) {
        rateLimiter.handleRequest("userA");
      }
      // Calling initializeUserBucket again should not reset tokens
      rateLimiter.initializeUserBucket("userA");
      // Consume the remaining tokens
      for (let i = 0; i < 5; i++) {
        const outcome = rateLimiter.handleRequest("userA");
        expect(outcome.success).toBe(true);
      }
      // The next request should fail as tokens are exhausted
      const finalAttempt = rateLimiter.handleRequest("userA");
      expect(finalAttempt.success).toBe(false);
      expect(finalAttempt.message).toMatch(/rate limit exceeded/i);
    });
  });

  // ------------------------------------------------------------------------------------
  // Token Refilling Mechanism & Edge Timing (Merged)
  // ------------------------------------------------------------------------------------
  describe("Refill Mechanism", () => {
    it("should refill tokens based on elapsed time and load factor = 0", () => {
      const userId = "user3";
      rateLimiter.updateLoadFactor(0); // loadFactor 0 => refillRate = baseRate
      rateLimiter.handleRequest(userId); // consumes one token
      let bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBe(capacity - 1);

      // Advance time by 100ms
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);

      // Expected refill: 0.05 * 100 = 5 tokens; tokens should be capped at capacity
      bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBe(capacity);
    });

    it("should use minimum refill rate when load factor is 1", () => {
      const userId = "user4";
      // Set loadFactor to 1 (simulate heavy load)
      rateLimiter.updateLoadFactor(maxAllowedRequests + 100);
      rateLimiter.handleRequest(userId); // consumes one token → tokens = capacity - 1
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);

      // With loadFactor = 1, refill rate = max(0.05 * 0.1, computed refill) = 0.005 tokens/ms.
      // Over 100ms, expected refill = 0.005 * 100 = 0.5 tokens.
      const bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBeCloseTo(capacity - 1 + 0.5);
    });

    it("should never exceed bucket capacity after refill", () => {
      const userId = "user5";
      rateLimiter.updateLoadFactor(0);
      // Consume 5 tokens
      for (let i = 0; i < 5; i++) {
        rateLimiter.handleRequest(userId);
      }
      let bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBe(capacity - 5);

      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBeLessThanOrEqual(capacity);
    });

    it("Edge timing: a request arriving exactly at the moment of token refill should see the new tokens", () => {
      const userId = "userC";
      rateLimiter.initializeUserBucket(userId);
      // Drain all tokens
      for (let i = 0; i < capacity; i++) {
        rateLimiter.handleRequest(userId);
      }
      let attempt = rateLimiter.handleRequest(userId);
      expect(attempt.success).toBe(false);

      // Advance time exactly 100ms for a refill
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      const result = rateLimiter.handleRequest(userId);
      expect(result.success).toBe(true);
    });
  });

  // ------------------------------------------------------------------------------------
  // Dynamic Load Factor & Real-Time Throttling (Merged)
  // ------------------------------------------------------------------------------------
  describe("Dynamic Load Factor Updates", () => {
    it("should update global load factor based on active requests", () => {
      rateLimiter.updateLoadFactor(500);
      expect(rateLimiter.loadFactor).toBe(500 / maxAllowedRequests);

      rateLimiter.updateLoadFactor(2000);
      expect(rateLimiter.loadFactor).toBe(1);
    });

    it("should affect token refill rates immediately after load factor changes", () => {
      const userId = "user6";
      rateLimiter.updateLoadFactor(0);
      rateLimiter.handleRequest(userId); // token consumed
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      let bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBe(capacity);

      // Change to heavy load:
      rateLimiter.updateLoadFactor(2000);
      rateLimiter.handleRequest(userId);
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBeLessThanOrEqual(capacity);
    });

    it("loadFactor must be capped at 1 even if activeRequests > 1000", () => {
      rateLimiter.updateLoadFactor(5000);
      expect(rateLimiter.loadFactor).toBe(1);
    });
  });

  // ------------------------------------------------------------------------------------
  // Request Handling & Concurrency (Merged)
  // ------------------------------------------------------------------------------------
  describe("Request Handling", () => {
    it("should allow a request if at least 1 token is available and deduct one token", () => {
      const userId = "user7";
      rateLimiter.updateLoadFactor(0);
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(true);

      const bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBe(capacity - 1);
    });

    it("should deny a request if tokens are insufficient", () => {
      const userId = "user8";
      rateLimiter.updateLoadFactor(0);
      // Consume all tokens
      for (let i = 0; i < capacity; i++) {
        rateLimiter.handleRequest(userId);
      }
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/rate limit exceeded/i);
    });

    it("should process a request arriving exactly at the moment of token refill", () => {
      const userId = "user9";
      rateLimiter.updateLoadFactor(0);
      rateLimiter.handleRequest(userId);
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(true);
    });

    it("should handle concurrent requests atomically", async () => {
      const userId = "user10";
      rateLimiter.updateLoadFactor(0);
      const requests = [];
      for (let i = 0; i < capacity; i++) {
        requests.push(Promise.resolve(rateLimiter.handleRequest(userId)));
      }
      const results = await Promise.all(requests);
      const successCount = results.filter((r) => r.success).length;
      expect(successCount).toBe(capacity);

      const extra = rateLimiter.handleRequest(userId);
      expect(extra.success).toBe(false);
    });

    it("Requests from different users do not affect each other's bucket", () => {
      rateLimiter.initializeUserBucket("userH");
      rateLimiter.initializeUserBucket("userI");
      rateLimiter.handleRequest("userH");
      rateLimiter.handleRequest("userH");
      rateLimiter.handleRequest("userI");

      const bucketA = rateLimiter.requests.get("userH");
      const bucketB = rateLimiter.requests.get("userI");
      expect(bucketA.tokens).toBe(capacity - 2);
      expect(bucketB.tokens).toBe(capacity - 1);
    });

    it("Atomic token deduction: a user cannot surpass limit if multiple requests occur simultaneously", () => {
      rateLimiter.initializeUserBucket("userJ");
      let successCount = 0;
      for (let i = 0; i < 12; i++) {
        const result = rateLimiter.handleRequest("userJ");
        if (result.success) successCount++;
      }
      expect(successCount).toBe(10);
    });
  });

  // ------------------------------------------------------------------------------------
  // Bucket Reset Mechanism (Merged)
  // ------------------------------------------------------------------------------------
  describe("Bucket Reset Mechanism", () => {
    it("should clear unused user buckets after 24 hours", () => {
      const userId = "user11";
      rateLimiter.updateLoadFactor(0);
      rateLimiter.handleRequest(userId);
      const bucket = rateLimiter.requests.get(userId);
      expect(bucket).toBeDefined();

      // Simulate inactivity by setting both lastRefill and lastRequest to an old timestamp
      bucket.lastRefill = Date.now() - (24 * 60 * 60 * 1000 + 1000);
      bucket.lastRequest = Date.now() - (24 * 60 * 60 * 1000 + 1000);

      // Advance time by 24 hours to trigger the reset mechanism
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      expect(rateLimiter.requests.get(userId)).toBeUndefined();
    });

    it("should reset tokens to full capacity for active buckets after 24 hours", () => {
      const userId = "user12";
      rateLimiter.updateLoadFactor(0);
      rateLimiter.handleRequest(userId);
      let bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBeLessThan(capacity);
      // Mark as active by updating lastRequest
      bucket.lastRequest = Date.now();
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      bucket = rateLimiter.requests.get(userId);
      expect(bucket).toBeDefined();
      expect(bucket.tokens).toBe(capacity);
    });
  });
});
