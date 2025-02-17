const crypto = require("crypto");
const AuthService = require("./auth");

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
    // Assume enhanced AuthService initializes a twoFactorStore as a Map
    authService.twoFactorStore = new Map();
  });

  test("Should return error when user is not found", () => {
    const result = authService.login("nonexistent", "whatever");
    expect(result).toEqual({ success: false, message: "User not found" });
  });

  test("Should return error when password is incorrect", () => {
    const result = authService.login("alice", "wrongpassword");
    expect(result).toEqual({ success: false, message: "Incorrect password" });
  });

  test("Should return error when contact details are missing", () => {
    const result = authService.login("charlie", "charliepass");
    expect(result).toEqual({
      success: false,
      message: "2FA cannot be initiated, contact details missing.",
    });
  });

  test("Successful login initiates 2FA", () => {
    const result = authService.login("alice", "password123");
    expect(result).toHaveProperty("twoFactor", true);
    expect(result.message).toBe(
      "2FA code sent. Please verify to complete login."
    );
    const twoFAData = authService.twoFactorStore.get("alice");
    expect(twoFAData).toHaveProperty("twoFactorCode");
    expect(twoFAData).toHaveProperty("twoFactorExpiry");
    expect(twoFAData.twoFactorCode).toBeGreaterThanOrEqual(100000);
    expect(twoFAData.twoFactorCode).toBeLessThanOrEqual(999999);
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
    const { twoFactorCode } = authService.twoFactorStore.get("alice");
    const wrongCode = twoFactorCode === 100000 ? 100001 : twoFactorCode - 1;
    const verifyResult = authService.verifyTwoFactor("alice", wrongCode);
    expect(verifyResult).toEqual({
      success: false,
      message: "Incorrect 2FA code.",
    });
  });

  test("Should fail verification if code expired", () => {
    jest.useFakeTimers();
    authService.login("bob", "bobpass");
    const { twoFactorCode } = authService.twoFactorStore.get("bob");
    jest.advanceTimersByTime(31000);
    const verifyResult = authService.verifyTwoFactor("bob", twoFactorCode);
    expect(verifyResult).toEqual({
      success: false,
      message: "2FA code expired.",
    });
    jest.useRealTimers();
  });

  test("Should return error if verifyTwoFactor is called before 2FA code is generated", () => {
    const result = authService.verifyTwoFactor("alice", 123456);
    expect(result).toEqual({
      success: false,
      message: "2FA process not started.",
    });
  });

  test("Should not allow reuse of 2FA code", () => {
    authService.login("alice", "password123");
    const { twoFactorCode } = authService.twoFactorStore.get("alice");
    const firstVerify = authService.verifyTwoFactor("alice", twoFactorCode);
    expect(firstVerify).toHaveProperty("success", true);
    const secondVerify = authService.verifyTwoFactor("alice", twoFactorCode);
    expect(secondVerify).toEqual({
      success: false,
      message: "2FA process not started.",
    });
  });
});
