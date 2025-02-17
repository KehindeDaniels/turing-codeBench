const crypto = require("crypto");

class AuthService {
  constructor(users) {
    // users: array of objects { username, password, email, phone }
    this.users = users;
    this.twoFactorStore = new Map(); // Maps username to { twoFactorCode, twoFactorExpiry }
  }

  login(username, password) {
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
        message: "2FA cannot be initiated, contact details missing.",
      };
    }
    const code = crypto.randomInt(100000, 999999);
    const expiry = Date.now() + 30000; // 30 seconds validity
    this.twoFactorStore.set(username, {
      twoFactorCode: code,
      twoFactorExpiry: expiry,
    });
    return {
      twoFactor: true,
      message: "2FA code sent. Please verify to complete login.",
    };
  }

  verifyTwoFactor(username, code) {
    const user = this.users.find((u) => u.username === username);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    const twoFactorData = this.twoFactorStore.get(username);
    if (!twoFactorData) {
      return { success: false, message: "2FA process not started." };
    }
    if (Date.now() > twoFactorData.twoFactorExpiry) {
      this.twoFactorStore.delete(username);
      return { success: false, message: "2FA code expired." };
    }
    if (parseInt(code) !== twoFactorData.twoFactorCode) {
      return { success: false, message: "Incorrect 2FA code." };
    }
    this.twoFactorStore.delete(username);
    return { success: true, user };
  }
}

module.exports = AuthService;
