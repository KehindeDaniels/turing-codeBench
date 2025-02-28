// notificationService.test.js
const NotificationService = require("./solution");

jest.useFakeTimers();

describe("NotificationService", () => {
  let service;
  let logSpy;

  beforeEach(() => {
    service = new NotificationService();
    service.clearCache();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("should send a single notification for a unique notification", () => {
    const notifications = [{ userId: "user1", message: "Order shipped" }];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(100);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(service.getSentCount()).toBe(1);
  });

  test("should not send duplicate notifications for exact duplicates", () => {
    const notifications = [
      { userId: "user1", message: "Order shipped" },
      { userId: "user1", message: "Order shipped" },
    ];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(100);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(service.getSentCount()).toBe(1);
  });

  test("should update cache after processing a notification", () => {
    const notifications = [{ userId: "user2", message: "New login detected" }];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(100);
    const key = "user2|New login detected";
    expect(service.sentCache[key]).toBe(true);
  });

  test("should not send notification if already processed (cache check)", () => {
    const notification = { userId: "user3", message: "Password changed" };
    service.sentCache["user3|Password changed"] = true;
    service.processNotifications([notification]);
    jest.advanceTimersByTime(100);
    expect(logSpy).not.toHaveBeenCalled();
    expect(service.getSentCount()).toBe(0);
  });

  test("should process multiple unique notifications", () => {
    const notifications = [
      { userId: "user1", message: "Order shipped" },
      { userId: "user2", message: "New login detected" },
      { userId: "user3", message: "Password changed" },
    ];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(100);
    expect(logSpy).toHaveBeenCalledTimes(3);
    expect(service.getSentCount()).toBe(3);
  });

  test("should treat notifications with extra whitespace as distinct", () => {
    const notifications = [
      { userId: "user1", message: "Order shipped" },
      { userId: "user1", message: "Order shipped " },
    ];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(100);
    expect(logSpy).toHaveBeenCalledTimes(2);
  });

  test("should treat notifications with different casing as distinct", () => {
    const notifications = [
      { userId: "User4", message: "New alert" },
      { userId: "user4", message: "New alert" },
    ];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(100);
    // two notifications due to case sensitivity
    expect(logSpy).toHaveBeenCalledTimes(2);
  });

  test("should process notifications concurrently without duplication", async () => {
    const notifications = [
      { userId: "user5", message: "Message received" },
      { userId: "user5", message: "Message received" },
    ];
    await service.processNotificationsConcurrently(notifications);
    jest.advanceTimersByTime(100);
    //  deduplication should prevent duplicates
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(service.getSentCount()).toBe(1);
  });

  test("should handle an empty notifications array gracefully", () => {
    service.processNotifications([]);
    jest.advanceTimersByTime(100);
    expect(logSpy).not.toHaveBeenCalled();
  });

  test("should throw error when processing null input", () => {
    expect(() => service.processNotifications(null)).toThrow(
      "Invalid notifications input; expected an array."
    );
  });

  test("should reject processing of an invalid notification object", async () => {
    await expect(
      service.processNotification({ userId: "user6" })
    ).rejects.toThrow("Invalid notification object.");
  });

  test("should not increase sentCount when processing a duplicate via processNotification", async () => {
    const notification = { userId: "user7", message: "Update available" };
    await service.processNotification(notification);
    jest.advanceTimersByTime(100);
    const initialCount = service.getSentCount();
    await service.processNotification(notification);
    jest.advanceTimersByTime(100);
    expect(service.getSentCount()).toBe(initialCount);
  });

  test("should process notifications concurrently and update cache properly", async () => {
    const notifications = [
      { userId: "user8", message: "Alert: High CPU usage" },
      { userId: "user8", message: "Alert: High CPU usage" },
      { userId: "user8", message: "Alert: High CPU usage" },
    ];
    await Promise.all(notifications.map((n) => service.processNotification(n)));
    jest.advanceTimersByTime(100);
    // Even with three concurrent notifications, only one should be sent ideally
    expect(service.getSentCount()).toBe(1);
  });

  test("should update sentCache only after a delay, allowing race conditions", () => {
    const notification = {
      userId: "user9",
      message: "System reboot scheduled",
    };
    service.processNotifications([notification, notification]);
    // Advance time partially (before the 30ms cache update)
    jest.advanceTimersByTime(15);
    // Cache may not yet be updated, so duplicates may be sent
    // This test expects a failure if deduplication were perfect
    expect(service.getSentCount()).toBeGreaterThanOrEqual(1);
    jest.advanceTimersByTime(20);
    expect(service.sentCache["user9|System reboot scheduled"]).toBe(true);
  });

  test("should clear cache and reset sent count", () => {
    const notification = { userId: "user10", message: "Backup completed" };
    service.processNotifications([notification]);
    jest.advanceTimersByTime(100);
    expect(service.getSentCount()).toBeGreaterThan(0);
    service.clearCache();
    expect(service.getSentCount()).toBe(0);
    expect(service.sentCache).toEqual({});
    expect(service.notificationLog).toEqual([]);
  });

  test("should log notifications with the correct format", () => {
    const notification = { userId: "user11", message: "Maintenance scheduled" };
    service.processNotifications([notification]);
    jest.advanceTimersByTime(100);
    const logMessage = logSpy.mock.calls[0][0];
    expect(logMessage).toMatch(
      /Notification sent to user11: Maintenance scheduled/
    );
  });

  test("should consider notifications with different punctuation as distinct", () => {
    const notifications = [
      { userId: "user12", message: "Update available!" },
      { userId: "user12", message: "Update available" },
    ];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(100);
    expect(logSpy).toHaveBeenCalledTimes(2);
  });

  test("should process a large batch of unique notifications efficiently", () => {
    const notifications = [];
    for (let i = 0; i < 50; i++) {
      notifications.push({ userId: `user${i}`, message: `Alert ${i}` });
    }
    service.processNotifications(notifications);
    jest.advanceTimersByTime(200);
    expect(service.getSentCount()).toBe(50);
    expect(Object.keys(service.sentCache).length).toBe(50);
  });

  test("should handle notifications with null message gracefully", async () => {
    await expect(
      service.processNotification({ userId: "user13", message: null })
    ).rejects.toThrow("Invalid notification object.");
  });

  test("should process notifications with numeric userId correctly", () => {
    const notifications = [
      { userId: 100, message: "Numeric ID test" },
      { userId: 100, message: "Numeric ID test" },
    ];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(100);
    expect(service.getSentCount()).toBe(1);
  });
});
