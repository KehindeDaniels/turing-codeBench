class NotificationService {
  constructor() {
    this.sentCache = new Map();
    this.sentCount = 0;
    this.notificationLog = [];
  }

  getCacheKey(notification) {
    return `${String(notification.userId)}|${notification.message}`;
  }

  async sendNotification(notification) {
    return new Promise((resolve) => {
      const delay = Math.floor(Math.random() * 40) + 10;
      setTimeout(() => {
        const logMessage = `Notification sent to ${notification.userId}: ${notification.message}`;
        console.log(logMessage);
        this.notificationLog.push(logMessage);
        this.sentCount++;
        resolve();
      }, delay);
    });
  }

  async processNotifications(notifications) {
    if (!Array.isArray(notifications)) {
      throw new Error("Invalid notifications input; expected an array.");
    }

    if (notifications.length === 0) {
      return;
    }

    const uniqueNotifications = new Map();
    notifications.forEach((notification) => {
      const key = this.getCacheKey(notification);
      if (!this.sentCache.has(key) && !uniqueNotifications.has(key)) {
        uniqueNotifications.set(key, notification);
      }
    });

    const processingPromises = Array.from(uniqueNotifications.entries()).map(
      async ([key, notification]) => {
        if (!this.sentCache.has(key)) {
          this.sentCache.set(key, true);
          await this.sendNotification(notification);
        }
      }
    );

    await Promise.all(processingPromises);
  }

  async processNotification(notification) {
    return new Promise((resolve, reject) => {
      if (!notification || !notification.userId || !notification.message) {
        reject(new Error("Invalid notification object."));
        return;
      }

      const key = this.getCacheKey(notification);
      if (!this.sentCache.has(key)) {
        this.sentCache.set(key, true);
        this.sendNotification(notification)
          .then(() => resolve())
          .catch(reject);
      } else {
        resolve();
      }
    });
  }

  async processNotificationsConcurrently(notifications) {
    if (!Array.isArray(notifications)) {
      throw new Error("Invalid notifications input; expected an array.");
    }

    if (notifications.length === 0) {
      return;
    }

    const uniqueNotifications = new Map();
    notifications.forEach((notification) => {
      const key = this.getCacheKey(notification);
      if (!this.sentCache.has(key) && !uniqueNotifications.has(key)) {
        uniqueNotifications.set(key, notification);
      }
    });

    await Promise.all(
      Array.from(uniqueNotifications.values()).map((notification) =>
        this.processNotification(notification)
      )
    );
  }

  clearCache() {
    this.sentCache.clear();
    this.notificationLog = [];
    this.sentCount = 0;
  }

  getSentCount() {
    return this.sentCount;
  }
}

module.exports = NotificationService;
