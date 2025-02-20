const ApiRateLimiter = require("./solution"); 

describe("ApiRateLimiter Dynamic Throttling", () => {
  let rateLimiter;
  // Default token bucket capacity is 10 tokens.
  const capacity = 10;
  // maxAllowedRequests for loadFactor calculation.
  const maxAllowedRequests = 1000;

  beforeEach(() => {
    jest.useFakeTimers("modern");
    // Create a new instance; assume the enhanced implementation now uses token buckets.
    rateLimiter = new ApiRateLimiter();
    // Our enhanced implementation uses a Map to store token buckets.
    rateLimiter.tokenBuckets = new Map();
    // Set initial global loadFactor to 0.
    rateLimiter.loadFactor = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Normal Load (loadFactor < 0.5)", () => {
    beforeEach(() => {
      // Set loadFactor via updateLoadFactor: activeRequests = 100 -> loadFactor = 0.1
      rateLimiter.updateLoadFactor(100);
    });

    test("should initialize bucket and allow requests up to capacity", () => {
      const userId = "user1";
      // First request triggers bucket initialization.
      for (let i = 0; i < capacity; i++) {
        const res = rateLimiter.handleRequest(userId);
        expect(res.success).toBe(true);
      }
      // Next request should be rejected due to empty tokens.
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(false);
      expect(res.message).toBe("Rate limit exceeded. Try again later.");
    });

    test("should refill tokens after 100ms and allow request", () => {
      const userId = "user1";
      // Consume all tokens.
      for (let i = 0; i < capacity; i++) {
        rateLimiter.handleRequest(userId);
      }
      expect(rateLimiter.handleRequest(userId).success).toBe(false);
      // Advance time by 100ms.
      jest.advanceTimersByTime(100);
      // Refill tokens.
      rateLimiter.refillTokens(userId);
      // A request now should succeed (at least 1 token refilled).
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(true);
    });
  });

  describe("High Load (loadFactor > 0.8)", () => {
    beforeEach(() => {
      // Set high load: activeRequests = 900 -> loadFactor = 0.9
      rateLimiter.updateLoadFactor(900);
    });

    test("should refill tokens at a slower rate under high load", () => {
      const userId = "user2";
      // Consume full bucket.
      for (let i = 0; i < capacity; i++) {
        rateLimiter.handleRequest(userId);
      }
      expect(rateLimiter.handleRequest(userId).success).toBe(false);
      // Under high load, refillRate = 0.05 * (1 - 0.9) = 0.005 tokens/ms.
      // After 200ms, tokens refilled ≈ 1 token.
      jest.advanceTimersByTime(200);
      rateLimiter.refillTokens(userId);
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(true);
    });
  });

  describe("Multiple Users", () => {
    test("each user has an independent token bucket", () => {
      rateLimiter.updateLoadFactor(50); // low load for both users
      const userA = "userA";
      const userB = "userB";

      // Consume full bucket for userA.
      for (let i = 0; i < capacity; i++) {
        expect(rateLimiter.handleRequest(userA).success).toBe(true);
      }
      expect(rateLimiter.handleRequest(userA).success).toBe(false);

      // UserB should still have full capacity.
      for (let i = 0; i < capacity; i++) {
        expect(rateLimiter.handleRequest(userB).success).toBe(true);
      }
      expect(rateLimiter.handleRequest(userB).success).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("request exactly at token refill time is allowed", () => {
      rateLimiter.updateLoadFactor(100); // low load
      const userId = "userEdge";
      for (let i = 0; i < capacity; i++) {
        rateLimiter.handleRequest(userId);
      }
      expect(rateLimiter.handleRequest(userId).success).toBe(false);
      // Advance time exactly 100ms.
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      // Should allow request as tokens are refilled.
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(true);
    });

    test("dynamic load factor change affects refill rate immediately", () => {
      const userId = "userDynamic";
      // Start with low load.
      rateLimiter.updateLoadFactor(100); // loadFactor = 0.1
      for (let i = 0; i < capacity; i++) {
        rateLimiter.handleRequest(userId);
      }
      // Wait 100ms under low load.
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      // Update to high load.
      rateLimiter.updateLoadFactor(900); // loadFactor becomes 0.9
      // Advance time another 100ms.
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens(userId);
      // Under high load, refill is slower; at least 1 token should be available.
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(true);
    });
  });

  describe("Scheduled Reset Behavior", () => {
    test("token buckets are reset every 24 hours", () => {
      const userId = "resetUser";
      rateLimiter.updateLoadFactor(100);
      for (let i = 0; i < capacity; i++) {
        rateLimiter.handleRequest(userId);
      }
      expect(rateLimiter.handleRequest(userId).success).toBe(false);
      // Simulate 24 hours passing.
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      // Assume a scheduled reset function is implemented.
      if (typeof rateLimiter.resetTokenBuckets === "function") {
        rateLimiter.resetTokenBuckets();
      }
      // After reset, the bucket should be full.
      const res = rateLimiter.handleRequest(userId);
      expect(res.success).toBe(true);
    });
  });
  test("loadFactor should be capped at 1 when activeRequests exceed maxAllowedRequests", () => {
    rateLimiter.updateLoadFactor(1200); // Exceed maxAllowedRequests (1000)
    expect(rateLimiter.loadFactor).toBe(1); // Should be capped at 1
  });
test("refill should still happen at minimum rate when loadFactor = 1", () => {
  const userId = "userHighLoad";
  rateLimiter.updateLoadFactor(1000); // loadFactor = 1
  for (let i = 0; i < capacity; i++) {
    rateLimiter.handleRequest(userId);
  }
  expect(rateLimiter.handleRequest(userId).success).toBe(false);
  jest.advanceTimersByTime(200); // Advance time to allow minimal refill
  rateLimiter.refillTokens(userId);
  expect(rateLimiter.handleRequest(userId).success).toBe(true); // Must refill at minimum rate
});
test("concurrent requests should not cause race conditions in token bucket updates", () => {
  const userId = "concurrentUser";
  rateLimiter.updateLoadFactor(100);
  for (let i = 0; i < capacity - 1; i++) {
    rateLimiter.handleRequest(userId);
  }

  // Simulate two concurrent requests at the last token
  const res1 = rateLimiter.handleRequest(userId);
  const res2 = rateLimiter.handleRequest(userId);

  // Only one should succeed, the other should be blocked
  expect([res1.success, res2.success]).toContain(true);
  expect([res1.success, res2.success]).toContain(false);
});

});
