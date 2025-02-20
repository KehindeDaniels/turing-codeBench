const crypto = require("crypto");

class AuthService {
  constructor(users) {
    this.users = users;
    this.twoFactorStore = new Map();
  }

  login(username, password, device) {
    const user = this.users.find((u) => u.username === username);
    if (!user) {
      return { success: false, message: "User not found" };
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
    if (user.isLocked) {
      return {
        success: false,
        message: "Account locked due to multiple failed attempts.",
      };
    }

    const twoFactorCode = crypto.randomInt(100000, 999999);
    const twoFactorExpiry = Math.floor(Date.now() / 1000) + 30; // 30 seconds

    const userTwoFactorData = this.twoFactorStore.get(username) || {};
    userTwoFactorData[device] = { twoFactorCode, twoFactorExpiry };
    this.twoFactorStore.set(username, userTwoFactorData);

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

    const userTwoFactorData = this.twoFactorStore.get(username);
    if (!userTwoFactorData || !userTwoFactorData[device]) {
      return { success: false, message: "2FA process not started" };
    }

    const { twoFactorCode, twoFactorExpiry } = userTwoFactorData[device];
    if (Math.floor(Date.now() / 1000) >= twoFactorExpiry) {
      delete userTwoFactorData[device];
      this.twoFactorStore.set(username, userTwoFactorData);
      return { success: false, message: "2FA code has expired" };
    }

    if (code !== twoFactorCode) {
      user.consecutiveFailures = (user.consecutiveFailures || 0) + 1;
      if (user.consecutiveFailures >= 3) {
        user.isLocked = true;
      }
      return { success: false, message: "Incorrect 2FA code." };
    }

    delete userTwoFactorData[device];
    this.twoFactorStore.set(username, userTwoFactorData);
    user.consecutiveFailures = 0;

    return { success: true, user };
  }
}

module.exports = { AuthService };

