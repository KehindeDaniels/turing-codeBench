/**
 * @file ApiRateLimiter.test.js
 * Comprehensive test suite for the enhanced ApiRateLimiter class.
 */

const { ApiRateLimiter } = require("./solution");

describe("ApiRateLimiter - Token Bucket + Dynamic Throttling", () => {
  let rateLimiter;

  beforeAll(() => {
    jest.useFakeTimers(); // For testing timing-based behaviors (refills, 24hr reset, etc.)
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Create a fresh instance before each test
    rateLimiter =
      new ApiRateLimiter(/* Possibly pass any constructor params if needed */);
  });

  // ------------------------------------------------------------------------------------
  // 1) Bucket Initialization & Basic Checks
  // ------------------------------------------------------------------------------------
  describe("Bucket Initialization", () => {
    test("initializeUserBucket() creates a bucket with default capacity=10 and tokens=10", () => {
      rateLimiter.initializeUserBucket("userA");

      // We can't check the internals directly unless the class exposes them.
      // So we rely on handleRequest() or refillTokens() to confirm behavior.
      // We'll do an immediate handleRequest to see if tokens exist.

      const result = rateLimiter.handleRequest("userA");
      expect(result.success).toBe(true); // Should succeed since user got 10 tokens by default
    });

    test("initializeUserBucket() called twice should NOT reinitialize if bucket already exists", () => {
      rateLimiter.initializeUserBucket("userA");
      // Drain some tokens to see if they remain unchanged after second init call
      for (let i = 0; i < 5; i++) {
        rateLimiter.handleRequest("userA");
      }

      // Reinitialize
      rateLimiter.initializeUserBucket("userA");

      // After reinit, userA's tokens should NOT be reset to 10
      // Try to consume the remaining 5 tokens
      for (let i = 0; i < 5; i++) {
        const outcome = rateLimiter.handleRequest("userA");
        expect(outcome.success).toBe(true);
      }

      // Now, the next request should fail
      const finalAttempt = rateLimiter.handleRequest("userA");
      expect(finalAttempt.success).toBe(false);
      expect(finalAttempt.message).toMatch(/rate limit exceeded/i);
    });
  });

  // ------------------------------------------------------------------------------------
  // 2) Token Refilling Mechanism
  // ------------------------------------------------------------------------------------
  describe("Token Refilling & Edge Timing", () => {
    test("refillTokens() should add tokens based on elapsed time, capped at capacity", () => {
      rateLimiter.initializeUserBucket("userB");

      // Drain all tokens
      for (let i = 0; i < 10; i++) {
        const outcome = rateLimiter.handleRequest("userB");
        expect(outcome.success).toBe(true);
      }

      // Now userB has 0 tokens
      let outcome = rateLimiter.handleRequest("userB");
      expect(outcome.success).toBe(false);

      // Advance time by 1000 ms (simulate 1s)
      jest.advanceTimersByTime(1000);

      // Manually call refillTokens() to mimic real usage
      rateLimiter.refillTokens("userB");

      // Each ms can add 0.05 tokens * (1 - loadFactor) by default => we assume loadFactor=0 if not set
      // So, in 1000ms with loadFactor=0 => refill = 0.05 * 1000 = 50 tokens
      // But capacity is 10 => should be capped at 10

      outcome = rateLimiter.handleRequest("userB");
      expect(outcome.success).toBe(true); // Should succeed => tokens got refilled to capacity
    });

    test("Edge timing: a request arriving exactly at refill moment should see the newly refilled tokens", () => {
      rateLimiter.initializeUserBucket("userC");

      // Drain all tokens
      for (let i = 0; i < 10; i++) {
        rateLimiter.handleRequest("userC");
      }

      // Next request fails
      let attempt = rateLimiter.handleRequest("userC");
      expect(attempt.success).toBe(false);

      // Move time by exactly 100ms to trigger partial refill
      jest.advanceTimersByTime(100);

      // Immediately handleRequest => should invoke refillTokens internally (or we do manually)
      // The moment of checking should see newly refilled tokens
      // Suppose baseRate=0.05 => 100ms => 5 tokens if loadFactor=0 => partial fill
      // Enough to allow a request to pass
      rateLimiter.refillTokens("userC");
      const result = rateLimiter.handleRequest("userC");
      expect(result.success).toBe(true);
    });

    test("If loadFactor=1, refill should be min 10% of baseRate to avoid total blockage", () => {
      rateLimiter.initializeUserBucket("userD");

      // Drain all tokens
      for (let i = 0; i < 10; i++) {
        rateLimiter.handleRequest("userD");
      }

      // For demonstration, let's set loadFactor=1
      rateLimiter.updateLoadFactor(1001); // anything above 1000 => loadFactor = 1

      // Move 200ms => check how many tokens got refilled
      jest.advanceTimersByTime(200);

      rateLimiter.refillTokens("userD");
      // If loadFactor=1 => refillRate = 0.1 * baseRate => baseRate=0.05 => 0.005 tokens/ms
      // Over 200ms => 1 token (approx)
      // So userD should have ~1 token
      const result = rateLimiter.handleRequest("userD");
      expect(result.success).toBe(true); // They can make exactly 1 request now
    });
  });

  // ------------------------------------------------------------------------------------
  // 3) Dynamic Throttling Based on System Load
  // ------------------------------------------------------------------------------------
  describe("updateLoadFactor() & Real-Time Throttling", () => {
    test("updateLoadFactor(activeRequests) modifies loadFactor => affects next refill instantly", () => {
      rateLimiter.initializeUserBucket("userE");

      // Drain all tokens
      for (let i = 0; i < 10; i++) {
        rateLimiter.handleRequest("userE");
      }

      // If we don't update loadFactor, assume it's 0 => high refill
      jest.advanceTimersByTime(100);
      rateLimiter.refillTokens("userE");
      // Should have ~5 tokens now

      // Drain those 5 tokens
      for (let i = 0; i < 5; i++) {
        const attempt = rateLimiter.handleRequest("userE");
        expect(attempt.success).toBe(true);
      }

      // Now update loadFactor to something like 0.5 => half refill
      // Suppose activeRequests=500 => loadFactor=0.5 => refillRate=0.05*(1-0.5)=0.025 tokens/ms
      rateLimiter.updateLoadFactor(500);

      // Advance 200ms => refill => 200 * 0.025 = 5 tokens
      jest.advanceTimersByTime(200);
      rateLimiter.refillTokens("userE");

      // So userE should have 5 tokens
      let outcome = rateLimiter.handleRequest("userE");
      expect(outcome.success).toBe(true); // #1
      outcome = rateLimiter.handleRequest("userE");
      expect(outcome.success).toBe(true); // #2
      outcome = rateLimiter.handleRequest("userE");
      expect(outcome.success).toBe(true); // #3
      outcome = rateLimiter.handleRequest("userE");
      expect(outcome.success).toBe(true); // #4
      outcome = rateLimiter.handleRequest("userE");
      expect(outcome.success).toBe(true); // #5

      // Next should fail
      outcome = rateLimiter.handleRequest("userE");
      expect(outcome.success).toBe(false);
      expect(outcome.message).toMatch(/rate limit exceeded/i);
    });

    test("loadFactor must be capped at 1 even if activeRequests > 1000", () => {
      rateLimiter.updateLoadFactor(5000); // Something huge
      // Internally => loadFactor=1
      // We test it indirectly:
      rateLimiter.initializeUserBucket("userF");

      // Drain tokens
      for (let i = 0; i < 10; i++) {
        rateLimiter.handleRequest("userF");
      }

      // Advance 200ms with loadFactor=1 => refillRate = 0.1 * 0.05 = 0.005 tokens/ms => 1 token after 200ms
      jest.advanceTimersByTime(200);
      rateLimiter.refillTokens("userF");

      const attempt = rateLimiter.handleRequest("userF");
      expect(attempt.success).toBe(true); // They get exactly 1 token
    });
  });

  // ------------------------------------------------------------------------------------
  // 4) handleRequest() & Edge Cases
  // ------------------------------------------------------------------------------------
  describe("handleRequest() End-to-End", () => {
    test("handleRequest(user) returns success=true if tokens >= 1, else false", () => {
      rateLimiter.initializeUserBucket("userG");

      // We have 10 tokens
      for (let i = 0; i < 10; i++) {
        const outcome = rateLimiter.handleRequest("userG");
        expect(outcome.success).toBe(true);
      }

      // Next request => Should fail
      const finalAttempt = rateLimiter.handleRequest("userG");
      expect(finalAttempt.success).toBe(false);
      expect(finalAttempt.message).toMatch(/rate limit exceeded/i);
    });

    test("Requests from different users do not affect each other's bucket", () => {
      rateLimiter.initializeUserBucket("userH");
      rateLimiter.initializeUserBucket("userI");

      // Drain userH fully
      for (let i = 0; i < 10; i++) {
        rateLimiter.handleRequest("userH");
      }
      // userH now has 0, userI still has 10
      const hOutcome = rateLimiter.handleRequest("userH");
      expect(hOutcome.success).toBe(false);

      // userI should still have 10 tokens
      const iOutcome = rateLimiter.handleRequest("userI");
      expect(iOutcome.success).toBe(true);
    });

    test("Atomic token deduction: a user cannot surpass limit if multiple requests occur simultaneously (simulation)", () => {
      rateLimiter.initializeUserBucket("userJ");

      // We'll simulate 12 concurrent requests
      // In real concurrency, you'd do advanced sync, but let's do a simple loop:
      let successCount = 0;
      for (let i = 0; i < 12; i++) {
        const result = rateLimiter.handleRequest("userJ");
        if (result.success) successCount++;
      }
      // Should only allow 10 successful requests
      expect(successCount).toBe(10);
    });
  });

  // ------------------------------------------------------------------------------------
  // 5) 24-Hour Reset
  // ------------------------------------------------------------------------------------
  describe("24-Hour Reset of Buckets", () => {
    test("Buckets belonging to inactive users are removed after 24 hours, active user tokens reset to capacity", () => {
      rateLimiter.initializeUserBucket("userK");
      rateLimiter.initializeUserBucket("userL");

      // Drain some tokens from userK
      for (let i = 0; i < 5; i++) {
        rateLimiter.handleRequest("userK");
      }

      // userL remains inactive
      // Advance time by slightly less than 24 hours => no reset
      jest.advanceTimersByTime(24 * 60 * 60 * 1000 - 1000);
      // handleRequest => no reset yet
      let outcomeK = rateLimiter.handleRequest("userK");
      expect(outcomeK.success).toBe(true); // userK should still have 4 tokens left

      // Now advance the additional 1000ms to hit 24 hours
      jest.advanceTimersByTime(1000);

      // The system's setInterval or background job presumably triggers the reset now.
      // Next request from userK => tokens should be reset to capacity
      outcomeK = rateLimiter.handleRequest("userK");
      expect(outcomeK.success).toBe(true);

      // This means userK was considered "active" and thus only the tokens got reset, not removed

      // Meanwhile, userL never used its bucket => it should be removed as "inactive"
      // The next request from userL is effectively a new initialization
      const outcomeL = rateLimiter.handleRequest("userL");
      expect(outcomeL.success).toBe(true); // Because userL's bucket was removed, then reinitialized at capacity
    });
  });
});
