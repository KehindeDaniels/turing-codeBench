const crypto = require("crypto");

class AuthService {
  constructor(users) {
    this.users = users;
    this.twoFactorStore = new Map();
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

    // Generate and store 2FA code
    const twoFactorCode = crypto.randomInt(100000, 999999);
    const twoFactorExpiry = Math.floor(Date.now() / 1000) + 30; // 30 seconds validity

    this.twoFactorStore.set(username, {
      twoFactorCode,
      twoFactorExpiry,
    });

    return {
      success: true,
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

    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime > twoFactorData.twoFactorExpiry) {
      this.twoFactorStore.delete(username);
      return { success: false, message: "2FA code has expired." };
    }

    if (parseInt(code) !== twoFactorData.twoFactorCode) {
      return { success: false, message: "Invalid 2FA code." };
    }

    // Clear 2FA data after successful verification
    this.twoFactorStore.delete(username);

    return {
      success: true,
      user: {
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    };
  }
}

module.exports = AuthService;
