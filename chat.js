const crypto = require("crypto");
const AuthService = require("./solution");

describe("AuthService 2FA Enhancement", () => {
  let authService;
  let users;

  beforeEach(() => {
    users = [
      {
        username: "alice",
        password: "password123",
        email: "alice@example.com",
        phone: "1234567890",
      },
      {
        username: "bob",
        password: "bobpass",
        email: "bob@example.com",
        phone: "0987654321",
      },
      { username: "charlie", password: "charliepass" }, // Missing contact details
    ];
    authService = new AuthService(users);
    authService.twoFactorStore = new Map(); // Ensure 2FA store is initialized
  });

  test("Should return error when user is not found", () => {
    const result = authService.login("nonexistent", "whatever");
    expect(result).toEqual({
      success: false,
      message: expect.stringMatching(/user not found/i),
    });
  });

  test("Should return error when password is incorrect", () => {
    const result = authService.login("alice", "wrongpassword");
    expect(result).toEqual({
      success: false,
      message: expect.stringMatching(/incorrect password/i),
    });
  });

  test("Should return error when contact details are missing", () => {
    const result = authService.login("charlie", "charliepass");
    expect(result).toEqual({
      success: false,
      message: expect.stringMatching(/2fa cannot be initiated/i),
    });
  });

  test("Successful login initiates 2FA", () => {
    const result = authService.login("alice", "password123");
    expect(result).toHaveProperty("twoFactor", true);
    expect(result.message).toMatch(/2fa code sent/i);

    const twoFAData = authService.twoFactorStore.get("alice");
    expect(twoFAData).toHaveProperty("twoFactorCode");
    expect(twoFAData).toHaveProperty("twoFactorExpiry");
    expect(twoFAData.twoFactorCode).toBeGreaterThanOrEqual(100000);
    expect(twoFAData.twoFactorCode).toBeLessThanOrEqual(999999);
    expect(twoFAData.twoFactorExpiry - Date.now()).toBeLessThanOrEqual(30000);
  });

  test("Successful 2FA verification", () => {
    authService.login("bob", "bobpass");
    const { twoFactorCode } = authService.twoFactorStore.get("bob");
    const verifyResult = authService.verifyTwoFactor("bob", twoFactorCode);
    expect(verifyResult).toHaveProperty("success", true);
    expect(verifyResult).toHaveProperty("user");
    expect(verifyResult.user.username).toBe("bob");
    expect(authService.twoFactorStore.get("bob")).toBeUndefined();
  });

  test("Should fail verification with incorrect 2FA code", () => {
    authService.login("alice", "password123");
    const wrongCode = 999999;
    const verifyResult = authService.verifyTwoFactor("alice", wrongCode);
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/invalid|incorrect/i),
    });
  });

  test("Should fail verification if code expired", () => {
    jest.useFakeTimers();
    authService.login("bob", "bobpass");
    const { twoFactorCode } = authService.twoFactorStore.get("bob");
    jest.advanceTimersByTime(31000); // Simulate code expiry after 31 seconds
    const verifyResult = authService.verifyTwoFactor("bob", twoFactorCode);
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/expired/i),
    });
    jest.useRealTimers();
  });

  test("Should return error if verifyTwoFactor is called before 2FA code is generated", () => {
    const result = authService.verifyTwoFactor("alice", 123456);
    expect(result).toEqual({
      success: false,
      message: expect.stringMatching(/2fa process not started/i),
    });
  });

  test("Should not allow reuse of 2FA code", () => {
    authService.login("alice", "password123");
    const { twoFactorCode } = authService.twoFactorStore.get("alice");

    // First attempt should succeed
    const firstVerify = authService.verifyTwoFactor("alice", twoFactorCode);
    expect(firstVerify).toHaveProperty("success", true);

    // Second attempt should fail
    const secondVerify = authService.verifyTwoFactor("alice", twoFactorCode);
    expect(secondVerify).toEqual({
      success: false,
      message: expect.stringMatching(/2fa process not started/i),
    });
  });

  test("verifyTwoFactor should return error if user does not exist", () => {
    const result = authService.verifyTwoFactor("nonexistent", 123456);
    expect(result).toEqual({
      success: false,
      message: expect.stringMatching(/user not found/i),
    });
  });

  test("Multiple login calls override previous 2FA code", () => {
    authService.login("alice", "password123");
    const firstCode = authService.twoFactorStore.get("alice").twoFactorCode;
    authService.login("alice", "password123");
    const secondCode = authService.twoFactorStore.get("alice").twoFactorCode;

    expect(firstCode).not.toEqual(secondCode); // New code overrides the old one
  });

  test("Should accept 2FA code provided as a string", () => {
    authService.login("bob", "bobpass");
    const { twoFactorCode } = authService.twoFactorStore.get("bob");
    const verifyResult = authService.verifyTwoFactor(
      "bob",
      String(twoFactorCode)
    );
    expect(verifyResult).toHaveProperty("success", true);
    expect(verifyResult.user.username).toBe("bob");
  });

  test("Should allow verification at exactly the expiry time", () => {
    jest.useFakeTimers("modern");
    authService.login("alice", "password123");
    const { twoFactorCode, twoFactorExpiry } =
      authService.twoFactorStore.get("alice");

    // Set time to exactly the expiry time
    jest.setSystemTime(twoFactorExpiry);
    const verifyResult = authService.verifyTwoFactor("alice", twoFactorCode);
    expect(verifyResult).toHaveProperty("success", true);
    expect(verifyResult.user.username).toBe("alice");
    jest.useRealTimers();
  });
});
