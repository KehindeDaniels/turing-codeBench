// oauth2Token.test.js

const { refreshTokenConditionally, getCurrentToken } = require("./solution");

describe("OAuth2 Token Refresh Module", () => {
  let originalDateNow;

  beforeEach(() => {
    // Save original Date.now to restore later.
    originalDateNow = Date.now;
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should return the current access token if the token is still valid (more than 1 second remaining)", async () => {
    // Assume the token was initialized with expiresAt = Date.now() + 5000.
    // Simulate a time where the token is still valid (e.g., only 1 second has passed).
    const baseTime = Date.now();
    // For a correctly fixed implementation, the token should only refresh when less than 1 second remains.
    // Here we simulate a time well before expiry.
    jest.spyOn(Date, "now").mockImplementation(() => baseTime + 1000);
    const tokenBefore = getCurrentToken();
    const accessToken = await refreshTokenConditionally();
    // Expect that the token hasn't been refreshed.
    expect(accessToken).toBe(tokenBefore.accessToken);
  });

  test("should refresh the token when it is nearly expired and update the global token state (successful refresh)", async () => {
    const tokenBefore = getCurrentToken();
    // Simulate near expiry: less than 1 second remaining.
    // For example, if token.expiresAt is originally set far in the future,
    // we force Date.now() to be close to token.expiresAt.
    const simulatedTime = tokenBefore.expiresAt - 500; // less than 1 second remaining
    jest.spyOn(Date, "now").mockImplementation(() => simulatedTime);
    // Force the refresh to succeed by making Math.random return a value >= 0.7.
    jest.spyOn(Math, "random").mockReturnValue(0.8);

    const newAccessToken = await refreshTokenConditionally();
    // The returned access token should differ from the original.
    expect(newAccessToken).not.toBe(tokenBefore.accessToken);
    // Verify that the global token state has been updated.
    const tokenAfter = getCurrentToken();
    expect(tokenAfter.accessToken).toBe(newAccessToken);
    // The new expiresAt should be in the future relative to the simulated time.
    expect(tokenAfter.expiresAt).toBeGreaterThan(simulatedTime);
  });

  test("should throw an error if token refresh fails", async () => {
    const tokenBefore = getCurrentToken();
    // Simulate near expiry so that refresh is attempted.
    const simulatedTime = tokenBefore.expiresAt - 500;
    jest.spyOn(Date, "now").mockImplementation(() => simulatedTime);
    // Force refresh failure by making Math.random return a value less than 0.7.
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    // Expect the promise to reject with the proper error message.
    await expect(refreshTokenConditionally()).rejects.toThrow(
      "Token refresh failed: Token refresh request failed"
    );
  });

  test("should handle concurrent refresh calls and update the token consistently", async () => {
    const tokenBefore = getCurrentToken();
    const simulatedTime = tokenBefore.expiresAt - 500;
    jest.spyOn(Date, "now").mockImplementation(() => simulatedTime);
    // Force a successful refresh.
    jest.spyOn(Math, "random").mockReturnValue(0.8);

    // Initiate two concurrent calls.
    const [accessToken1, accessToken2] = await Promise.all([
      refreshTokenConditionally(),
      refreshTokenConditionally(),
    ]);
    // Both calls should return the same new access token.
    expect(accessToken1).toBe(accessToken2);
    // Global token state should reflect the new token.
    const tokenAfter = getCurrentToken();
    expect(tokenAfter.accessToken).toBe(accessToken1);
  });

  test("getCurrentToken should return an object with valid properties", () => {
    const token = getCurrentToken();
    // Check that token has a non-empty string for accessToken,
    // a non-empty string for refreshToken, and a positive numeric expiresAt.
    expect(typeof token.accessToken).toBe("string");
    expect(token.accessToken.length).toBeGreaterThan(0);
    expect(typeof token.refreshToken).toBe("string");
    expect(token.refreshToken.length).toBeGreaterThan(0);
    expect(typeof token.expiresAt).toBe("number");
    expect(token.expiresAt).toBeGreaterThan(Date.now());
  });

  test("should not refresh token when exactly 1 second remaining", async () => {
    const tokenBefore = getCurrentToken();
    const simulatedTime = tokenBefore.expiresAt - 1000; // exactly 1 second
    jest.spyOn(Date, "now").mockImplementation(() => simulatedTime);

    const accessToken = await refreshTokenConditionally();
    expect(accessToken).toBe(tokenBefore.accessToken);
  });

  test("should refresh token when less than 1 millisecond remaining", async () => {
    const tokenBefore = getCurrentToken();
    const simulatedTime = tokenBefore.expiresAt - 1;
    jest.spyOn(Date, "now").mockImplementation(() => simulatedTime);
    jest.spyOn(Math, "random").mockReturnValue(0.8);

    const newAccessToken = await refreshTokenConditionally();
    expect(newAccessToken).not.toBe(tokenBefore.accessToken);
  });

  test("should maintain token state after failed refresh attempt", async () => {
    const tokenBefore = getCurrentToken();
    const simulatedTime = tokenBefore.expiresAt - 500;
    jest.spyOn(Date, "now").mockImplementation(() => simulatedTime);
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    try {
      await refreshTokenConditionally();
    } catch (error) {
      const tokenAfter = getCurrentToken();
      expect(tokenAfter).toEqual(tokenBefore);
    }
  });

  test("should handle multiple sequential refresh attempts", async () => {
    const tokenBefore = getCurrentToken();
    const simulatedTime = tokenBefore.expiresAt - 500;
    jest.spyOn(Date, "now").mockImplementation(() => simulatedTime);
    jest.spyOn(Math, "random").mockReturnValue(0.8);

    const firstRefresh = await refreshTokenConditionally();
    const secondRefresh = await refreshTokenConditionally();
    expect(firstRefresh).toBe(secondRefresh);
  });

  test("should refresh token when expiresAt is in the past", async () => {
    const tokenBefore = getCurrentToken();
    const simulatedTime = tokenBefore.expiresAt + 1000; // 1 second past expiration
    jest.spyOn(Date, "now").mockImplementation(() => simulatedTime);
    jest.spyOn(Math, "random").mockReturnValue(0.8);

    const newAccessToken = await refreshTokenConditionally();
    expect(newAccessToken).not.toBe(tokenBefore.accessToken);
  });

  test("should handle multiple concurrent refresh failures", async () => {
    const tokenBefore = getCurrentToken();
    const simulatedTime = tokenBefore.expiresAt - 500;
    jest.spyOn(Date, "now").mockImplementation(() => simulatedTime);
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    const refreshPromises = [
      refreshTokenConditionally(),
      refreshTokenConditionally(),
      refreshTokenConditionally(),
    ];

    await expect(Promise.all(refreshPromises)).rejects.toThrow(
      "Token refresh failed: Token refresh request failed"
    );
  });

  test("getCurrentToken should maintain consistent state between calls", () => {
    const firstCall = getCurrentToken();
    const secondCall = getCurrentToken();
    expect(firstCall).toEqual(secondCall);
  });

  test("should handle edge case with maximum safe integer expiration", async () => {
    const tokenBefore = getCurrentToken();
    const simulatedTime = Number.MAX_SAFE_INTEGER;
    jest.spyOn(Date, "now").mockImplementation(() => simulatedTime);
    jest.spyOn(Math, "random").mockReturnValue(0.8);

    const newAccessToken = await refreshTokenConditionally();
    const tokenAfter = getCurrentToken();
    expect(tokenAfter.expiresAt).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  test("should refresh token with exactly 0.7 random value", async () => {
    const tokenBefore = getCurrentToken();
    const simulatedTime = tokenBefore.expiresAt - 500;
    jest.spyOn(Date, "now").mockImplementation(() => simulatedTime);
    jest.spyOn(Math, "random").mockReturnValue(0.7);

    const newAccessToken = await refreshTokenConditionally();
    expect(newAccessToken).not.toBe(tokenBefore.accessToken);
  });
});
