describe("OAuth2 Token Refresh Module", () => {
  let refreshTokenConditionally, getCurrentToken;
  const INITIAL_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
  const INITIAL_REFRESH_TOKEN = "dGVzdF9yZWZyZXNoX3Rva2Vu";

  // Reload the module before each test to reset internal state.
  beforeEach(() => {
    jest.resetModules();
    ({ refreshTokenConditionally, getCurrentToken } = require("./solution"));
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("should return the current access token immediately when still valid", async () => {
    const tokenBefore = getCurrentToken();
    const token = await refreshTokenConditionally();
    expect(token).toBe(tokenBefore.accessToken);

    const tokenAfter = getCurrentToken();
    expect(tokenAfter.accessToken).toBe(tokenBefore.accessToken);
    expect(tokenAfter.refreshToken).toBe(tokenBefore.refreshToken);
    expect(tokenAfter.expiresAt).toBeGreaterThan(Date.now());
  });

  test("should refresh the token when less than 1 second of validity remains", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.8);

    const baseTime = Date.now();
    jest.useFakeTimers("modern");
    jest.setSystemTime(baseTime);

    // Set time so that there is 100ms left
    jest.setSystemTime(baseTime + 4900);

    const refreshPromise = refreshTokenConditionally();
    jest.advanceTimersByTime(150);
    const newAccessToken = await refreshPromise;

    expect(newAccessToken).not.toBe(INITIAL_ACCESS_TOKEN);
    const tokenAfter = getCurrentToken();
    expect(tokenAfter.accessToken).toBe(newAccessToken);
    expect(tokenAfter.refreshToken).toMatch(
      new RegExp(`^${INITIAL_REFRESH_TOKEN}_`)
    );
    expect(tokenAfter.expiresAt).toBeGreaterThan(Date.now());

    jest.useRealTimers();
  });

  test("should throw an error when token refresh fails", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    const baseTime = Date.now();
    jest.useFakeTimers("modern");
    jest.setSystemTime(baseTime + 4900);

    const refreshPromise = refreshTokenConditionally();
    jest.advanceTimersByTime(150);

    await expect(refreshPromise).rejects.toThrow();

    // Global state should not be changed
    const token = getCurrentToken();
    expect(token.accessToken).toBe(INITIAL_ACCESS_TOKEN);
    expect(token.refreshToken).toBe(INITIAL_REFRESH_TOKEN);

    jest.useRealTimers();
  });

  test("getCurrentToken returns the actual current token state", () => {
    const token = getCurrentToken();
    expect(token).toHaveProperty("accessToken", INITIAL_ACCESS_TOKEN);
    expect(token).toHaveProperty("refreshToken", INITIAL_REFRESH_TOKEN);
    expect(typeof token.expiresAt).toBe("number");
    expect(token.expiresAt).toBeGreaterThan(Date.now());
  });

  test("concurrent calls to refreshTokenConditionally should result in a single token refresh", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.8);

    const baseTime = Date.now();
    jest.useFakeTimers("modern");
    jest.setSystemTime(baseTime + 4900);

    const promises = [
      refreshTokenConditionally(),
      refreshTokenConditionally(),
      refreshTokenConditionally(),
    ];

    jest.advanceTimersByTime(150);
    const results = await Promise.all(promises);

    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);

    const token = getCurrentToken();
    expect(token.accessToken).toBe(results[0]);

    jest.useRealTimers();
  });

  test("should not refresh token when exactly 1000ms of validity remains", async () => {
    const baseTime = Date.now();
    jest.useFakeTimers("modern");
    jest.setSystemTime(baseTime + 4000);

    const tokenBefore = getCurrentToken();
    const tokenPromise = refreshTokenConditionally();

    // timer to trigger any potential refresh operation
    jest.advanceTimersByTime(150);

    const tokenResult = await tokenPromise;

    if (tokenResult === tokenBefore.accessToken) {
      // No refresh occurred
      const tokenAfter = getCurrentToken();
      expect(tokenAfter.accessToken).toBe(tokenBefore.accessToken);
      expect(tokenAfter.refreshToken).toBe(tokenBefore.refreshToken);
    } else {
      // A refresh occurred here, then the new token must be different and must follow the refresh contract
      expect(tokenResult).not.toBe(tokenBefore.accessToken);
      const tokenAfter = getCurrentToken();
      expect(tokenAfter.accessToken).toBe(tokenResult);
      expect(tokenAfter.refreshToken).toMatch(
        new RegExp(`^${INITIAL_REFRESH_TOKEN}_`)
      );
      expect(tokenAfter.expiresAt).toBeGreaterThan(Date.now());
    }

    jest.useRealTimers();
  });

  test("concurrent refresh failure: multiple calls should all reject and leave state unchanged", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    const baseTime = Date.now();
    jest.useFakeTimers("modern");
    jest.setSystemTime(baseTime + 4900);

    const promises = [
      refreshTokenConditionally(),
      refreshTokenConditionally(),
      refreshTokenConditionally(),
    ];

    jest.advanceTimersByTime(150);
    // All promises should reject.
    for (const p of promises) {
      await expect(p).rejects.toThrow();
    }

    // Global state remains unchanged.
    const token = getCurrentToken();
    expect(token.accessToken).toBe(INITIAL_ACCESS_TOKEN);
    expect(token.refreshToken).toBe(INITIAL_REFRESH_TOKEN);

    jest.useRealTimers();
  });

  test("should attempt a new refresh after a failed refresh", async () => {
    // First attempt fails.
    jest.spyOn(Math, "random").mockReturnValueOnce(0.5); // force failure
    const baseTime = Date.now();
    jest.useFakeTimers("modern");
    jest.setSystemTime(baseTime + 4900);

    const failedPromise = refreshTokenConditionally();
    jest.advanceTimersByTime(150);
    await expect(failedPromise).rejects.toThrow();

    // Global state should remain unchanged.
    let token = getCurrentToken();
    expect(token.accessToken).toBe(INITIAL_ACCESS_TOKEN);

    // Now, attempt a refresh with success
    jest.spyOn(Math, "random").mockReturnValueOnce(0.8); // force success
    // The token is still near expiry.
    const successPromise = refreshTokenConditionally();
    jest.advanceTimersByTime(150);
    const newAccessToken = await successPromise;

    expect(newAccessToken).not.toBe(INITIAL_ACCESS_TOKEN);
    token = getCurrentToken();
    expect(token.accessToken).toBe(newAccessToken);

    jest.useRealTimers();
  });

  test("getCurrentToken should return a copy that cannot be mutated externally", () => {
    const token1 = getCurrentToken();
    // Mutate the returned object
    token1.accessToken = "mutated_value";
    token1.refreshToken = "mutated_value";
    token1.expiresAt = 0;

    // A subsequent call to getCurrentToken should return the original internal state.
    const token2 = getCurrentToken();
    expect(token2.accessToken).toBe(INITIAL_ACCESS_TOKEN);
    expect(token2.refreshToken).toBe(INITIAL_REFRESH_TOKEN);
    expect(token2.expiresAt).toBeGreaterThan(Date.now());
  });

  test("should maintain original expiry if no refresh is triggered", async () => {
    // When the token is valid, no refresh should occur and the expiry remains unchanged.
    const tokenBefore = getCurrentToken();
    const originalExpiry = tokenBefore.expiresAt;

    // Call without advancing time past the near-expiry threshold.
    const token = await refreshTokenConditionally();
    expect(token).toBe(tokenBefore.accessToken);

    // Advance time a little but not enough to trigger refresh
    jest.useFakeTimers("modern");
    jest.advanceTimersByTime(500); // less than the threshold change
    const tokenAfter = await refreshTokenConditionally();
    expect(tokenAfter).toBe(tokenBefore.accessToken);

    const tokenState = getCurrentToken();
    expect(tokenState.expiresAt).toBe(originalExpiry);

    jest.useRealTimers();
  });

  test("should update token expiry to a new value within expected range after refresh", async () => {
    // When a refresh occurs, the new expiry should be roughly Date.now() + 4000.
    jest.spyOn(Math, "random").mockReturnValue(0.8);
    const baseTime = Date.now();
    jest.useFakeTimers("modern");
    jest.setSystemTime(baseTime + 4900); // nearly expired

    const refreshPromise = refreshTokenConditionally();
    jest.advanceTimersByTime(150);
    await refreshPromise;

    const tokenState = getCurrentToken();
    const now = Date.now();
    // Expect the new expiry to be within a reasonable range of 4000ms from now.
    expect(tokenState.expiresAt).toBeGreaterThan(now + 3500);
    expect(tokenState.expiresAt).toBeLessThan(now + 4500);

    jest.useRealTimers();
  });

  test("should return the same token for multiple sequential calls when still valid", async () => {
    // When the token is valid, sequential calls should return the same token.
    const token1 = await refreshTokenConditionally();

    jest.useFakeTimers("modern");
    jest.advanceTimersByTime(300); // advance a small amount of time, still valid

    const token2 = await refreshTokenConditionally();
    expect(token2).toBe(token1);

    jest.useRealTimers();
  });
});
