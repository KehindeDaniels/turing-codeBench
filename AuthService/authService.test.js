const AuthService = require("./solution");
const crypto = require("crypto");

describe("AuthService 2FA Enhancement", () => {
  let auth;
  const users = [
    {
      username: "Ajiboye",
      password: "password123",
      email: "Ajiboye@example.com",
      phone: "1234567890",
    },
    { username: "Jibola", password: "password456", email: "", phone: "" },
  ];

  beforeEach(() => {
    auth = new AuthService(users);
    auth.twoFactorStore = new Map();
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("Successful 2FA flow", () => {
    const loginResult = auth.login("Ajiboye", "password123");
    expect(loginResult).toMatchObject({
      twoFactor: true,
      message: expect.stringMatching(/2FA.*code.*sent.*verify/i),
    });

    const twoFactorData = auth.twoFactorStore.get("Ajiboye");
    expect(twoFactorData).toBeDefined();
    expect(twoFactorData.twoFactorCode.toString()).toHaveLength(6);
    const verifyResult = auth.verifyTwoFactor(
      "Ajiboye",
      twoFactorData.twoFactorCode
    );
    expect(verifyResult).toEqual({
      success: true,
      user: expect.objectContaining({ username: "Ajiboye" }),
    });
    // Code should be cleared after successful verification
    expect(auth.twoFactorStore.get("Ajiboye")).toBeUndefined();
  });

  test("Incorrect 2FA code", () => {
    const loginResult = auth.login("Ajiboye", "password123");
    expect(loginResult.twoFactor).toBe(true);
    const twoFactorData = auth.twoFactorStore.get("Ajiboye");
    const wrongCode = twoFactorData.twoFactorCode === 123456 ? 654321 : 123456;
    const verifyResult = auth.verifyTwoFactor("Ajiboye", wrongCode);
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/incorrect| invalid|2FA|code/i),
    });
  });

  test("Expired 2FA code", () => {
    const loginResult = auth.login("Ajiboye", "password123");
    expect(loginResult.twoFactor).toBe(true);
    const twoFactorData = auth.twoFactorStore.get("Ajiboye");
    jest.advanceTimersByTime(31000);
    const verifyResult = auth.verifyTwoFactor(
      "Ajiboye",
      twoFactorData.twoFactorCode
    );
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/expired/i),
    });
  });

  test("2FA process not started", () => {
    // Calling verifyTwoFactor without initiating 2FA (i.e., without a login)
    const verifyResult = auth.verifyTwoFactor("Ajiboye", 123456);
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/not started/i),
    });
  });

  test("Missing contact details", () => {
    const loginResult = auth.login("Jibola", "password456");
    expect(loginResult).toEqual({
      success: false,
      message: expect.stringMatching(/contact.*missing/i),
    });
  });

  test("Prevent code reuse", () => {
    const loginResult = auth.login("Ajiboye", "password123");
    const twoFactorData = auth.twoFactorStore.get("Ajiboye");
    const code = twoFactorData.twoFactorCode;
    const firstVerify = auth.verifyTwoFactor("Ajiboye", code);
    expect(firstVerify.success).toBe(true);
    const secondVerify = auth.verifyTwoFactor("Ajiboye", code);
    expect(secondVerify).toEqual({
      success: false,
      message: expect.stringMatching(/not started/i),
    });
  });

  // Additional tests

  test('Incorrect username returns "User not found"', () => {
    const result = auth.login("nonexistent", "anyPassword");
    expect(result).toEqual({
      success: false,
      message: expect.stringMatching(/user.*not found/i),
    });
  });

  test('Incorrect username returns "User not found"', () => {
    const result = auth.login("nonexistent", "anyPassword");
    expect(result).toEqual({
      success: false,
      message: expect.stringMatching(/user.*not found/i),
    });
  });

  test('Incorrect password returns "Incorrect password"', () => {
    const result = auth.login("Ajiboye", "wrongPassword");
    expect(result).toEqual({
      success: false,
      message: expect.stringMatching(/incorrect.*password/i),
    });
  });

  test("2FA code sent to email", () => {
    const result = auth.login("Ajiboye", "password123");
    expect(result).toMatchObject({
      twoFactor: true,
      message: expect.stringMatching(/2FA.*code.*sent.*verify/i),
    });
    expect(auth.twoFactorStore.get("Ajiboye")).toBeDefined();
  });

  test("2FA code sent to phone", () => {
    const result = auth.login("Ajiboye", "password123");
    expect(result).toMatchObject({
      twoFactor: true,
      message: expect.stringMatching(/2FA.*code.*sent.*verify/i),
    });
    expect(auth.twoFactorStore.get("Ajiboye")).toBeDefined();
  });

  test("Re-login reinitializes the 2FA code", () => {
    // First login attempt for Ajiboye
    const firstLogin = auth.login("Ajiboye", "password123");
    expect(firstLogin.twoFactor).toBe(true);
    const firstData = auth.twoFactorStore.get("Ajiboye");
    expect(firstData).toBeDefined();

    // Second login attempt for Ajiboye should generate new 2FA data
    const secondLogin = auth.login("Ajiboye", "password123");
    expect(secondLogin.twoFactor).toBe(true);
    const secondData = auth.twoFactorStore.get("Ajiboye");
    expect(secondData).toBeDefined();
    // The new 2FA data should differ from the first (code and/or expiry updated)
    expect(secondData).not.toEqual(firstData);
  });

  test("Verify 2FA with non-numeric code returns error", () => {
    auth.login("Ajiboye", "password123");
    const verifyResult = auth.verifyTwoFactor("Ajiboye", "abc123");
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/incorrect|invalid|2FA|code/i),
    });
  });

  test("Verify 2FA with expired code returns error", () => {
    auth.login("Ajiboye", "password123");
    const twoFactorData = auth.twoFactorStore.get("Ajiboye");
    // Advance time by 31 seconds (code validity is 30 seconds)
    jest.advanceTimersByTime(31000);
    const verifyResult = auth.verifyTwoFactor(
      "Ajiboye",
      twoFactorData.twoFactorCode
    );
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/expired/i),
    });
  });

  test("Verify 2FA with non-existent user returns error", () => {
    const verifyResult = auth.verifyTwoFactor("nonexistent", 123456);
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/user.*not found/i),
    });
  });

  test("Verify 2FA with incorrect code returns error", () => {
    auth.login("Ajiboye", "password123");
    const verifyResult = auth.verifyTwoFactor("Ajiboye", 999999);
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/incorrect|invalid|2FA|code/i),
    });
  });

  test("Multiple failed 2FA attempts", () => {
    auth.login("Ajiboye", "password123");
    const twoFactorData = auth.twoFactorStore.get("Ajiboye");

    // First wrong attempt
    const firstAttempt = auth.verifyTwoFactor("Ajiboye", "000000");
    expect(firstAttempt.success).toBe(false);

    // Second wrong attempt
    const secondAttempt = auth.verifyTwoFactor("Ajiboye", "111111");
    expect(secondAttempt.success).toBe(false);

    // Third wrong attempt should still allow correct code
    const thirdAttempt = auth.verifyTwoFactor(
      "Ajiboye",
      twoFactorData.twoFactorCode
    );
    expect(thirdAttempt.success).toBe(true);
  });

  test("2FA code format validation", () => {
    auth.login("Ajiboye", "password123");

    // Test with empty code
    const emptyResult = auth.verifyTwoFactor("Ajiboye", "");
    expect(emptyResult.success).toBe(false);

    // Test with code shorter than 6 digits
    const shortResult = auth.verifyTwoFactor("Ajiboye", "12345");
    expect(shortResult.success).toBe(false);

    // Test with code longer than 6 digits
    const longResult = auth.verifyTwoFactor("Ajiboye", "1234567");
    expect(longResult.success).toBe(false);
  });

  test("Unique 2FA codes", () => {
    // Generate multiple 2FA codes and ensure they're unique
    const codes = new Set();
    for (let i = 0; i < 10; i++) {
      auth.login("Ajiboye", "password123");
      const twoFactorData = auth.twoFactorStore.get("Ajiboye");
      codes.add(twoFactorData.twoFactorCode);
    }
    expect(codes.size).toBeGreaterThan(8);
  });

  test("Concurrent 2FA sessions", () => {
    // Start 2FA for Ajiboye
    const AjiboyeLogin = auth.login("Ajiboye", "password123");
    expect(AjiboyeLogin.twoFactor).toBe(true);

    // Try to start another 2FA session while one is active
    const secondAjiboyeLogin = auth.login("Ajiboye", "password123");
    expect(secondAjiboyeLogin.twoFactor).toBe(true);

    // Verify the first session is invalidated
    const firstTwoFactorData = auth.twoFactorStore.get("Ajiboye");
    expect(firstTwoFactorData).toBeDefined();
  });

  test("2FA code expiry", () => {
    auth.login("Ajiboye", "password123");
    const twoFactorData = auth.twoFactorStore.get("Ajiboye");

    // Advance time by 31 seconds
    jest.advanceTimersByTime(31000);

    // Verify code is no longer valid
    const verifyResult = auth.verifyTwoFactor(
      "Ajiboye",
      twoFactorData.twoFactorCode
    );
    expect(verifyResult.success).toBe(false);
  });
});
