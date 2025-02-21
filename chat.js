// ApiRateLimiter.test.js
const { ApiRateLimiter } = require("./solution");

describe("ApiRateLimiter - Token Bucket Implementation", () => {
  let rateLimiter;
  const capacity = 10;
  const windowSize = 100; // Use 100ms as the base window for refill timing
  const baseRate = 0.05; // tokens per millisecond as specified
  const maxAllowedRequests = 1000; // for load factor calculation

  beforeEach(() => {
    jest.useFakeTimers();
    // Initialize a new instance for each test
    rateLimiter = new ApiRateLimiter(capacity, windowSize);
    // Assume that the enhanced version creates and manages a Map of user buckets (e.g., rateLimiter.requests)
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("User Bucket Initialization", () => {
    it("should initialize a new user's bucket with full capacity and set lastRefill", () => {
      const userId = "user1";
      // The first request should trigger initialization
      rateLimiter.updateLoadFactor(0);
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(true);

      const bucket = rateLimiter.requests.get(userId);
      expect(bucket).toBeDefined();
      expect(bucket.capacity).toBe(capacity);
      // Since one token was consumed by the request:
      expect(bucket.tokens).toBe(capacity - 1);
      expect(typeof bucket.lastRefill).toBe("number");
    });

    it("should not reinitialize a bucket if it already exists", () => {
      const userId = "user2";
      rateLimiter.updateLoadFactor(0);
      // First request initializes the bucket
      rateLimiter.handleRequest(userId);
      const bucketBefore = rateLimiter.requests.get(userId);

      // Advance time a little and make another request:
      jest.advanceTimersByTime(50);
      rateLimiter.handleRequest(userId);
      const bucketAfter = rateLimiter.requests.get(userId);

      // Ensure that the bucket object remains the same (only tokens and lastRefill updated)
      expect(bucketAfter.capacity).toBe(bucketBefore.capacity);
      // Expect tokens to have been deducted by 2 overall (plus any refill if applicable)
    });
  });

  describe("Refill Mechanism", () => {
    it("should refill tokens based on elapsed time and load factor = 0", () => {
      const userId = "user3";
      rateLimiter.updateLoadFactor(0); // loadFactor 0 → refillRate = baseRate (0.05 tokens/ms)
      rateLimiter.handleRequest(userId); // consumes one token (tokens become capacity - 1)
      let bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBe(capacity - 1);

      // Simulate passage of 100ms:
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);

      // Expected refill = 0.05 * 100 = 5 tokens, but bucket tokens cannot exceed capacity.
      // Starting with 9 tokens, refill would make it 14, capped at capacity (10).
      bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBe(capacity);
    });

    it("should use minimum refill rate when load factor is 1", () => {
      const userId = "user4";
      // Set load factor to 1 (simulate heavy load)
      rateLimiter.updateLoadFactor(maxAllowedRequests + 100); // any value beyond 1000 should cap to 1
      rateLimiter.handleRequest(userId); // token consumed → tokens = capacity - 1
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
  });

  describe("Dynamic Load Factor Updates", () => {
    it("should update global load factor based on active requests", () => {
      // When activeRequests = 500, loadFactor should be 0.5
      rateLimiter.updateLoadFactor(500);
      expect(rateLimiter.loadFactor).toBe(500 / maxAllowedRequests);

      // When activeRequests exceeds maxAllowedRequests, loadFactor should be capped at 1
      rateLimiter.updateLoadFactor(2000);
      expect(rateLimiter.loadFactor).toBe(1);
    });

    it("should affect token refill rates immediately after load factor changes", () => {
      const userId = "user6";
      // Start with loadFactor = 0
      rateLimiter.updateLoadFactor(0);
      rateLimiter.handleRequest(userId); // token consumed
      // Advance 100ms with low load:
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      let bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBe(capacity); // refilled to max

      // Now change load factor to heavy load:
      rateLimiter.updateLoadFactor(2000);
      // Consume a token again
      rateLimiter.handleRequest(userId);
      // Advance 100ms and refill with new load factor (min refill rate applies)
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      bucket = rateLimiter.requests.get(userId);
      // Tokens should have increased by ~0.5 (as computed above) without exceeding capacity
      expect(bucket.tokens).toBeLessThanOrEqual(capacity);
    });
  });

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
      // Consume tokens until empty
      for (let i = 0; i < capacity; i++) {
        rateLimiter.handleRequest(userId);
      }
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(false);
      expect(res.message).toBe("Rate limit exceeded. Try again later.");
    });

    it("should process a request arriving exactly at the moment of token refill", () => {
      const userId = "user9";
      rateLimiter.updateLoadFactor(0);
      // Consume one token
      rateLimiter.handleRequest(userId);

      // Advance time exactly to the refill interval
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      // The next request should benefit from the refilled tokens
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(true);
    });

    it("should handle concurrent requests atomically", async () => {
      const userId = "user10";
      rateLimiter.updateLoadFactor(0);
      // Simulate concurrent requests by wrapping synchronous calls in promises:
      const requests = [];
      for (let i = 0; i < capacity; i++) {
        requests.push(Promise.resolve(rateLimiter.handleRequest(userId)));
      }
      const results = await Promise.all(requests);
      // All requests should succeed until tokens are exhausted
      const successCount = results.filter((r) => r.success).length;
      expect(successCount).toBe(capacity);

      // A further request should be denied
      const extra = rateLimiter.handleRequest(userId);
      expect(extra.success).toBe(false);
    });
  });

  describe("Independent User Buckets", () => {
    it("should maintain independent buckets for different users", () => {
      const userA = "Alice";
      const userB = "Bob";
      rateLimiter.updateLoadFactor(0);
      // Each user makes separate requests
      rateLimiter.handleRequest(userA);
      rateLimiter.handleRequest(userA);
      rateLimiter.handleRequest(userB);

      const bucketA = rateLimiter.requests.get(userA);
      const bucketB = rateLimiter.requests.get(userB);
      expect(bucketA.tokens).toBe(capacity - 2);
      expect(bucketB.tokens).toBe(capacity - 1);
    });
  });

  describe("Bucket Reset Mechanism", () => {
    it("should clear unused user buckets after 24 hours", () => {
      const userId = "user11";
      rateLimiter.updateLoadFactor(0);
      rateLimiter.handleRequest(userId);
      const bucket = rateLimiter.requests.get(userId);
      expect(bucket).toBeDefined();

      // Simulate the bucket being inactive by setting lastRefill to more than 24 hours ago
      bucket.lastRefill = Date.now() - (24 * 60 * 60 * 1000 + 1000);
      // Fast-forward time by 24 hours to trigger the reset (assuming the setInterval reset is in place)
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      // If the bucket is unused, it should be cleared
      expect(rateLimiter.requests.get(userId)).toBeUndefined();
    });

    it("should reset tokens to full capacity for active buckets after 24 hours", () => {
      const userId = "user12";
      rateLimiter.updateLoadFactor(0);
      // Create a bucket and use it so that it is marked as active
      rateLimiter.handleRequest(userId);
      let bucket = rateLimiter.requests.get(userId);
      expect(bucket.tokens).toBeLessThan(capacity);
      // Simulate recent activity by updating lastRefill to current time
      bucket.lastRefill = Date.now();
      // Fast-forward 24 hours to trigger the reset
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      bucket = rateLimiter.requests.get(userId);
      expect(bucket).toBeDefined();
      expect(bucket.tokens).toBe(capacity);
    });
  });
});
