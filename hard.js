const AuthService = require("./solution");
const crypto = require("crypto");

describe("AuthService 2FA Enhancement (Multi-Device & Account Locking)", () => {
  let auth;
  const users = [
    {
      username: "Ajiboye",
      password: "password123",
      email: "Ajiboye@example.com",
      phone: "1234567890",
    },
    {
      username: "Jibola",
      password: "password456",
      email: "",
      phone: "",
    },
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

  test("Successful 2FA flow (single device)", () => {
    const loginResult = auth.login("Ajiboye", "password123", "deviceA");
    expect(loginResult).toMatchObject({
      twoFactor: true,
      message: expect.stringMatching(/2FA.*code.*sent.*verify/i),
    });

    // Check stored 2FA data
    const twoFactorDataA = auth.twoFactorStore.get("Ajiboye")?.["deviceA"];
    expect(twoFactorDataA).toBeDefined();
    expect(twoFactorDataA.twoFactorCode.toString()).toHaveLength(6);

    // Verify 2FA
    const verifyResult = auth.verifyTwoFactor(
      "Ajiboye",
      "deviceA",
      twoFactorDataA.twoFactorCode
    );
    expect(verifyResult).toEqual({
      success: true,
      user: expect.objectContaining({ username: "Ajiboye" }),
    });
    // Code should be cleared for deviceA after successful verification
    const postVerify = auth.twoFactorStore.get("Ajiboye")?.["deviceA"];
    expect(postVerify).toBeUndefined();
  });

  test("Incorrect 2FA code (single device)", () => {
    auth.login("Ajiboye", "password123", "deviceA");
    const twoFactorDataA = auth.twoFactorStore.get("Ajiboye")?.["deviceA"];
    const wrongCode = twoFactorDataA.twoFactorCode === 123456 ? 654321 : 123456;

    const verifyResult = auth.verifyTwoFactor("Ajiboye", "deviceA", wrongCode);
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/incorrect| invalid|2FA|code/i),
    });
  });

  test("Expired 2FA code", () => {
    auth.login("Ajiboye", "password123", "deviceA");
    const twoFactorDataA = auth.twoFactorStore.get("Ajiboye")?.["deviceA"];

    // Advance time by 31 seconds to exceed the 30s validity
    jest.advanceTimersByTime(31_000);

    const verifyResult = auth.verifyTwoFactor(
      "Ajiboye",
      "deviceA",
      twoFactorDataA.twoFactorCode
    );
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/expired/i),
    });
  });

  test("2FA process not started", () => {
    // No login for deviceA => no code, so verification fails
    const verifyResult = auth.verifyTwoFactor("Ajiboye", "deviceA", 123456);
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/not started/i),
    });
  });

  test("Missing contact details", () => {
    const loginResult = auth.login("Jibola", "password456", "deviceA");
    expect(loginResult).toEqual({
      success: false,
      message: expect.stringMatching(/contact.*missing/i),
    });
  });

  test("Prevent code reuse", () => {
    auth.login("Ajiboye", "password123", "deviceA");
    const twoFactorDataA = auth.twoFactorStore.get("Ajiboye")?.["deviceA"];
    const code = twoFactorDataA.twoFactorCode;

    // First verify: should succeed
    const firstVerify = auth.verifyTwoFactor("Ajiboye", "deviceA", code);
    expect(firstVerify.success).toBe(true);

    // Second verify with same code: should fail
    const secondVerify = auth.verifyTwoFactor("Ajiboye", "deviceA", code);
    expect(secondVerify).toEqual({
      success: false,
      message: expect.stringMatching(/not started|expired|invalid/i),
    });
  });

  test("Incorrect username returns 'User not found'", () => {
    const result = auth.login("nonexistent", "anyPassword", "deviceA");
    expect(result).toEqual({
      success: false,
      message: expect.stringMatching(/user.*not found/i),
    });
  });

  test("Incorrect password returns 'Incorrect password'", () => {
    const result = auth.login("Ajiboye", "wrongPassword", "deviceA");
    expect(result).toEqual({
      success: false,
      message: expect.stringMatching(/incorrect.*password/i),
    });
  });

  test("2FA code sent to email and phone (assuming the user has both)", () => {
    // Just verifying we get the 2FA response if user has contact details
    const result = auth.login("Ajiboye", "password123", "deviceA");
    expect(result).toMatchObject({
      twoFactor: true,
      message: expect.stringMatching(/2FA.*code.*sent.*verify/i),
    });
    expect(auth.twoFactorStore.get("Ajiboye")?.["deviceA"]).toBeDefined();
  });

  test("Re-login reinitializes the 2FA code for the same device", () => {
    // First login => 2FA code #1
    const firstLogin = auth.login("Ajiboye", "password123", "deviceA");
    const firstData = auth.twoFactorStore.get("Ajiboye")?.["deviceA"];
    expect(firstData).toBeDefined();

    // Second login => 2FA code #2 (should differ from #1)
    const secondLogin = auth.login("Ajiboye", "password123", "deviceA");
    expect(secondLogin.twoFactor).toBe(true);
    const secondData = auth.twoFactorStore.get("Ajiboye")?.["deviceA"];
    expect(secondData).toBeDefined();
    // The new 2FA data should differ from the first
    expect(secondData).not.toEqual(firstData);
  });

  test("Verify 2FA with non-numeric code returns error", () => {
    auth.login("Ajiboye", "password123", "deviceA");
    const verifyResult = auth.verifyTwoFactor("Ajiboye", "deviceA", "abc123");
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/incorrect|invalid|2FA|code/i),
    });
  });

  test("Verify 2FA with non-existent user returns error", () => {
    const verifyResult = auth.verifyTwoFactor("nonexistent", "deviceA", 123456);
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/user.*not found/i),
    });
  });

  test("Verify 2FA with incorrect code returns error", () => {
    auth.login("Ajiboye", "password123", "deviceA");
    const verifyResult = auth.verifyTwoFactor("Ajiboye", "deviceA", 999999);
    expect(verifyResult).toEqual({
      success: false,
      message: expect.stringMatching(/incorrect|invalid|2FA|code/i),
    });
  });

    test("Multiple failed 2FA attempts do not lock until 3rd consecutive fail (single device)", () => {
      // Login + retrieve correct code
      auth.login("Ajiboye", "password123", "deviceA");
      const code = auth.twoFactorStore.get("Ajiboye")?.["deviceA"]?.twoFactorCode;

      // 1st wrong attempt
      let fail1 = auth.verifyTwoFactor("Ajiboye", "deviceA", "000000");
      expect(fail1.success).toBe(false);

      // 2nd wrong attempt
      let fail2 = auth.verifyTwoFactor("Ajiboye", "deviceA", "111111");
      expect(fail2.success).toBe(false);

      // 3rd wrong attempt => should lock the account
      let fail3 = auth.verifyTwoFactor("Ajiboye", "deviceA", "222222");
      expect(fail3.success).toBe(false);
      expect(fail3.message).toMatch(/locked/i);

      // Even the correct code won't help now
      let postLock = auth.verifyTwoFactor("Ajiboye", "deviceA", code);
      expect(postLock.success).toBe(false);
      expect(postLock.message).toMatch(/locked/i);
    });
  test("Multi-device 2FA: separate codes for each device", () => {
    // Login from deviceA
    const loginA = auth.login("Ajiboye", "password123", "deviceA");
    expect(loginA.twoFactor).toBe(true);
    const codeA =
      auth.twoFactorStore.get("Ajiboye")?.["deviceA"]?.twoFactorCode;

    // Login from deviceB
    const loginB = auth.login("Ajiboye", "password123", "deviceB");
    expect(loginB.twoFactor).toBe(true);
    const codeB =
      auth.twoFactorStore.get("Ajiboye")?.["deviceB"]?.twoFactorCode;

    // The codes must differ
    expect(codeA).not.toBe(codeB);

    // Verifying deviceA with deviceB's code => fail
    let verifyWrong = auth.verifyTwoFactor("Ajiboye", "deviceA", codeB);
    expect(verifyWrong.success).toBe(false);

    // Verifying deviceB with deviceA's code => fail
    verifyWrong = auth.verifyTwoFactor("Ajiboye", "deviceB", codeA);
    expect(verifyWrong.success).toBe(false);

    // Correct verifications
    const verifyA = auth.verifyTwoFactor("Ajiboye", "deviceA", codeA);
    expect(verifyA.success).toBe(true);

    const verifyB = auth.verifyTwoFactor("Ajiboye", "deviceB", codeB);
    expect(verifyB.success).toBe(true);
  });

  test("2FA code format validation (multi-device scenario still valid)", () => {
    auth.login("Ajiboye", "password123", "deviceA");

    // empty string
    let emptyResult = auth.verifyTwoFactor("Ajiboye", "deviceA", "");
    expect(emptyResult.success).toBe(false);

    // shorter than 6 digits
    let shortResult = auth.verifyTwoFactor("Ajiboye", "deviceA", "12345");
    expect(shortResult.success).toBe(false);

    // longer than 6 digits
    let longResult = auth.verifyTwoFactor("Ajiboye", "deviceA", "1234567");
    expect(longResult.success).toBe(false);
  });

  test("Unique 2FA codes across multiple logins", () => {
    // Generate multiple 2FA codes for the same user & device
    const codes = new Set();
    for (let i = 0; i < 10; i++) {
      auth.login("Ajiboye", "password123", "deviceA");
      const code =
        auth.twoFactorStore.get("Ajiboye")?.["deviceA"]?.twoFactorCode;
      codes.add(code);
    }
    // We expect a good amount of uniqueness (though not guaranteed in real life,
    // but for test we check that it's not always the same code).
    expect(codes.size).toBeGreaterThan(8);
  });

  test("Concurrent 2FA sessions with the same device reinitializes the previous code", () => {
    // Start 2FA session #1
    auth.login("Ajiboye", "password123", "deviceA");
    const session1Code =
      auth.twoFactorStore.get("Ajiboye")?.["deviceA"]?.twoFactorCode;
    expect(session1Code).toBeDefined();

    // Re-start 2FA session #2 on the same device
    auth.login("Ajiboye", "password123", "deviceA");
    const session2Code =
      auth.twoFactorStore.get("Ajiboye")?.["deviceA"]?.twoFactorCode;
    expect(session2Code).toBeDefined();
    expect(session2Code).not.toBe(session1Code);
  });

  test("2FA code expiry (general check)", () => {
    auth.login("Ajiboye", "password123", "deviceA");
    const codeA =
      auth.twoFactorStore.get("Ajiboye")?.["deviceA"]?.twoFactorCode;

    // Advance time by 31 seconds
    jest.advanceTimersByTime(31000);

    // Verify code is no longer valid
    const verifyResult = auth.verifyTwoFactor("Ajiboye", "deviceA", codeA);
    expect(verifyResult.success).toBe(false);
    expect(verifyResult.message).toMatch(/expired|locked|incorrect/i);
  });

  test("Account lock blocks new login attempts too, once locked", () => {
    // Lock the user by failing 3 times on deviceA
    auth.login("Ajiboye", "password123", "deviceA");
    auth.verifyTwoFactor("Ajiboye", "deviceA", 111111);
    auth.verifyTwoFactor("Ajiboye", "deviceA", 222222);
    const fail3 = auth.verifyTwoFactor("Ajiboye", "deviceA", 333333);
    expect(fail3.success).toBe(false);
    expect(fail3.message).toMatch(/locked/i);

    // Now try a fresh login with correct password => should fail because user is locked
    const loginLocked = auth.login("Ajiboye", "password123", "deviceB");
    expect(loginLocked).toEqual({
      success: false,
      message: expect.stringMatching(/locked|multiple failed attempts/i),
    });
  });
});
