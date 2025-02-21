const crypto = require("crypto");

class AuthService {
  constructor(users) {
    // Initializing each user with isLocked and failedAttempts properties
    this.users = users.map((user) => ({
      ...user,
      isLocked: false,
      failedAttempts: 0,
    }));
    // twoFactorStore will then map username to an object mapping device this way{ twoFactorCode, twoFactorExpiry }
    this.twoFactorStore = new Map();
  }

  login(username, password, device) {
    const user = this.users.find((u) => u.username === username);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    if (user.isLocked) {
      return {
        success: false,
        message: "Account locked due to multiple failed attempts.",
      };
    }
    if (user.password !== password) {
      return { success: false, message: "Incorrect password" };
    }
    if (!user.email || !user.phone) {
      return {
        success: false,
        message: "2FA cannot be initiated, contact details missing",
      };
    }

    // Generate a 6-digit 2FA code
    const twoFactorCode = crypto.randomInt(100000, 999999);
    const twoFactorExpiry = Math.floor(Date.now() / 1000) + 30; // the code is valid for 30 seconds

    // Retrieve=ing any existing 2FA codes for the user and updating for the device.
    const existingUserCodes = this.twoFactorStore.get(username) || {};
    existingUserCodes[device] = { twoFactorCode, twoFactorExpiry };
    this.twoFactorStore.set(username, existingUserCodes);

    return {
      success: true,
      twoFactor: true,
      message: "2FA code sent. Please verify to complete login.",
    };
  }

  verifyTwoFactor(username, device, code) {
    const user = this.users.find((u) => u.username === username);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    if (user.isLocked) {
      return {
        success: false,
        message: "Account locked due to multiple failed attempts.",
      };
    }

    const userCodes = this.twoFactorStore.get(username);
    if (!userCodes || !userCodes[device]) {
      return { success: false, message: "2FA process not started" };
    }

    // Validating that the provided code is exactly 6 digits.
    if (!/^\d{6}$/.test(String(code))) {
      return { success: false, message: "Incorrect 2FA code." };
    }

    const { twoFactorCode, twoFactorExpiry } = userCodes[device];
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > twoFactorExpiry) {
      // Removing the expired 2FA code for the device
      delete userCodes[device];
      this.twoFactorStore.set(username, userCodes);
      return { success: false, message: "2FA code has expired" };
    }

    // Comparing the provided code (converted to number) with the stored code.
    if (parseInt(code, 10) !== twoFactorCode) {
      user.failedAttempts += 1;
      // them ock the account on the 3rd failed attempt instead of 2 like the incorrect solution
      if (user.failedAttempts >= 3) {
        user.isLocked = true;
        return {
          success: false,
          message: "Account locked due to multiple failed attempts.",
        };
      }
      return { success: false, message: "Incorrect 2FA code." };
    }

    // for successful verification, deleting the 2FA code and reset failed attempts.
    delete userCodes[device];
    this.twoFactorStore.set(username, userCodes);
    user.failedAttempts = 0;

    return {
      success: true,
      user: { username: user.username, email: user.email, phone: user.phone },
    };
  }
}

module.exports = { AuthService };
