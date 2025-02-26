const {
  refreshTokenConditionally,
  getCurrentToken,
} = require("./path/to/your/module");

describe("refreshTokenConditionally", () => {
  let originalToken;

  beforeEach(() => {
    // Save the original token state before each test
    originalToken = { ...currentToken };
  });

  afterEach(() => {
    // Restore the original token state after each test
    currentToken = { ...originalToken };
  });

  test("should return the current access token if it is still valid", async () => {
    const accessToken = await refreshTokenConditionally();
    expect(accessToken).toBe(currentToken.accessToken);
  });

  test("should refresh the token when it is nearly expired", async () => {
    // Set the token to be nearly expired
    currentToken.expiresAt = Date.now() + 500;

    const accessToken = await refreshTokenConditionally();
    expect(accessToken).not.toBe(originalToken.accessToken);
    expect(currentToken.accessToken).toBe(accessToken);
    expect(currentToken.refreshToken).not.toBe(originalToken.refreshToken);
    expect(currentToken.expiresAt).toBeGreaterThan(Date.now());
  });

  test("should throw an error if token refresh fails", async () => {
    // Set the token to be nearly expired
    currentToken.expiresAt = Date.now() + 500;

    // Mock the refreshTokenFromServer to always fail
    jest
      .spyOn(global, "refreshTokenFromServer")
      .mockImplementation(() =>
        Promise.reject(new Error("Token refresh request failed"))
      );

    await expect(refreshTokenConditionally()).rejects.toThrow(
      "Token refresh failed: Token refresh request failed"
    );
  });

  test("should handle concurrent refresh requests correctly", async () => {
    // Set the token to be nearly expired
    currentToken.expiresAt = Date.now() + 500;

    // Mock the refreshTokenFromServer to simulate a delay
    jest.spyOn(global, "refreshTokenFromServer").mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                accessToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_${Date.now()}`,
                refreshToken: `dGVzdF9yZWZyZXNoX3Rva2Vu_${Date.now()}`,
                expiresAt: Date.now() + 4000,
              }),
            100
          )
        )
    );

    // Trigger multiple concurrent refresh requests
    const promises = [
      refreshTokenConditionally(),
      refreshTokenConditionally(),
      refreshTokenConditionally(),
    ];

    const results = await Promise.all(promises);
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);
    expect(currentToken.accessToken).toBe(results[0]);
  });

  test("should update the global token state correctly after refresh", async () => {
    // Set the token to be nearly expired
    currentToken.expiresAt = Date.now() + 500;

    const accessToken = await refreshTokenConditionally();
    expect(currentToken.accessToken).toBe(accessToken);
    expect(currentToken.refreshToken).not.toBe(originalToken.refreshToken);
    expect(currentToken.expiresAt).toBeGreaterThan(Date.now());
  });

  test("getCurrentToken should return the current token state", () => {
    const token = getCurrentToken();
    expect(token.accessToken).toBe(currentToken.accessToken);
    expect(token.refreshToken).toBe(currentToken.refreshToken);
    expect(token.expiresAt).toBe(currentToken.expiresAt);
  });
});
