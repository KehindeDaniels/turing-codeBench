// notificationService.test.js
const NotificationService = require("./solution");

jest.useFakeTimers();

describe("NotificationService", () => {
  let service;
  let logSpy;

  beforeEach(() => {
    service = new NotificationService();
    service.resetCache();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("should send a single notification when processing one unique notification", () => {
    const notifications = [{ userId: "user1", message: "Order shipped" }];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(50);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toMatch(
      /Notification sent to user1: Order shipped/
    );
  });

  test("should not send duplicate notifications for exact duplicates", () => {
    const notifications = [
      { userId: "user1", message: "Order shipped" },
      { userId: "user1", message: "Order shipped" },
    ];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(50);
    // Due to race condition in deduplication, it may send duplicates.
    // Expected: Ideally, only one notification should be sent.
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  test("should update cache after processing notifications", () => {
    const notifications = [{ userId: "user2", message: "New login detected" }];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(50);
    const key = "user2|New login detected";
    expect(service.sentCache[key]).toBe(true);
  });

  test("should not send notification if already processed (cache check)", () => {
    const notification = { userId: "user3", message: "Password changed" };
    service.sentCache["user3|Password changed"] = true;
    service.processNotifications([notification]);
    jest.advanceTimersByTime(50);
    expect(logSpy).not.toHaveBeenCalled();
  });

  test("should process multiple unique notifications", () => {
    const notifications = [
      { userId: "user1", message: "Order shipped" },
      { userId: "user2", message: "New login detected" },
      { userId: "user3", message: "Password changed" },
    ];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(50);
    expect(logSpy).toHaveBeenCalledTimes(3);
  });

  test("should treat notifications with extra whitespace as distinct", () => {
    const notifications = [
      { userId: "user1", message: "Order shipped" },
      { userId: "user1", message: "Order shipped " }, // note trailing space
    ];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(50);
    expect(logSpy).toHaveBeenCalledTimes(2);
  });

  test("should process notifications concurrently (simulate race conditions)", async () => {
    const notifications = [
      { userId: "user4", message: "New message received" },
      { userId: "user4", message: "New message received" },
    ];
    // Process notifications concurrently using Promise.all and processNotification method
    await Promise.all(notifications.map((n) => service.processNotification(n)));
    jest.advanceTimersByTime(50);
    // Ideally, deduplication should send only one notification.
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  test("should send duplicate if deduplication delay causes race condition", () => {
    // Simulate two notifications arriving almost simultaneously (without waiting for cache update)
    const notifications = [
      { userId: "user5", message: "Alert: System down" },
      { userId: "user5", message: "Alert: System down" },
    ];
    // Call processNotifications twice in quick succession
    service.processNotifications(notifications);
    service.processNotifications(notifications);
    jest.advanceTimersByTime(50);
    // Due to race conditions, duplicates might be sent (test expected to fail if deduplication worked)
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  test("should not resend notifications if processed later (cache persists)", () => {
    const notification = { userId: "user6", message: "Disk space low" };
    service.processNotifications([notification]);
    jest.advanceTimersByTime(50);
    logSpy.mockClear();
    // Process same notification again after cache should be updated
    service.processNotifications([notification]);
    jest.advanceTimersByTime(50);
    // Expect no new notification logged because cache prevents resend
    expect(logSpy).not.toHaveBeenCalled();
  });

  test("should handle an empty notifications array gracefully", () => {
    service.processNotifications([]);
    jest.advanceTimersByTime(50);
    expect(logSpy).not.toHaveBeenCalled();
  });

  test("should handle null input without crashing", () => {
    expect(() => service.processNotifications(null)).toThrow();
  });

  test("should send notification when cache is reset", () => {
    const notification = { userId: "user7", message: "New offer available" };
    service.processNotifications([notification]);
    jest.advanceTimersByTime(50);
    expect(logSpy).toHaveBeenCalledTimes(1);
    service.resetCache();
    logSpy.mockClear();
    service.processNotifications([notification]);
    jest.advanceTimersByTime(50);
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  test("should log correct notification message format", () => {
    const notification = { userId: "user8", message: "Update available" };
    service.processNotifications([notification]);
    jest.advanceTimersByTime(50);
    const logMessage = logSpy.mock.calls[0][0];
    expect(logMessage).toMatch(/Notification sent to user8: Update available/);
  });

  test("should process notifications with different casing as distinct", () => {
    const notifications = [
      { userId: "User9", message: "Maintenance scheduled" },
      { userId: "user9", message: "Maintenance scheduled" },
    ];
    service.processNotifications(notifications);
    jest.advanceTimersByTime(50);
    expect(logSpy).toHaveBeenCalledTimes(2);
  });

  test("should eventually update cache even if sendNotification is delayed", () => {
    const notification = { userId: "user10", message: "Backup completed" };
    service.processNotifications([notification]);
    // Advance time partially so that sendNotification happens but cache update may not
    jest.advanceTimersByTime(15);
    // Cache might not be updated yet (intentional bug)
    expect(service.sentCache["user10|Backup completed"]).toBeUndefined();
    // Advance time past cache update delay
    jest.advanceTimersByTime(10);
    expect(service.sentCache["user10|Backup completed"]).toBe(true);
  });
});
