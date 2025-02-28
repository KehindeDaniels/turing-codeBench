const {
  sendNotification,
  deduplicateNotifications,
  processNotifications,
  notificationsSent,
} = require("./solution");
const jwt = require("jsonwebtoken");

// Helper function to pause execution for a given duration (ms)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Notification Service Module", () => {
  beforeEach(() => {
    // Clear the global notificationsSent array before each test
    notificationsSent.length = 0;
  });

  describe("deduplicateNotifications", () => {
    test("should remove duplicate notifications based on id", () => {
      const notifications = [
        { id: "1", message: "Message One" },
        { id: "2", message: "Message Two" },
        { id: "1", message: "Duplicate Message One" },
        { id: "3", message: "Message Three" },
        { id: "2", message: "Duplicate Message Two" },
      ];
      const deduped = deduplicateNotifications(notifications);
      expect(deduped.length).toBe(3);
      const ids = deduped.map((n) => n.id).sort();
      expect(ids).toEqual(["1", "2", "3"]);
    });
  });

  describe("sendNotification", () => {
    test("should send a notification and return a confirmation message", async () => {
      // Force success by making Math.random() return 0.5
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const notification = { id: "10", message: "Test Message" };
      const res = await sendNotification(notification);
      expect(res).toBe("Notification 10 sent");
      expect(notificationsSent).toContain("10");
      Math.random.mockRestore();
    });

    test("should fail sending notification and throw an error", async () => {
      // Force failure by making Math.random() return 0.1
      jest.spyOn(Math, "random").mockReturnValue(0.1);
      const notification = { id: "11", message: "Fail Message" };
      await expect(sendNotification(notification)).rejects.toThrow(
        "Network error"
      );
      Math.random.mockRestore();
    });
  });

  describe("processNotifications", () => {
    test("should process deduplicated notifications and return result messages", async () => {
      // Force Math.random() to return 0.5 to simulate success
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const notifications = [
        { id: "20", message: "Message 20" },
        { id: "21", message: "Message 21" },
        { id: "20", message: "Duplicate Message 20" },
      ];
      const results = await processNotifications(notifications);
      // Wait for asynchronous operations to finish (since processNotifications is flawed)
      await sleep(200);
      // Expect that 2 unique notifications were sent, so results should have 2 entries.
      expect(results.length).toBe(2);
      expect(results).toContain("Notification 20 sent");
      expect(results).toContain("Notification 21 sent");
      Math.random.mockRestore();
    });

    test("should not send duplicate notifications", async () => {
      // Force success
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const notifications = [
        { id: "30", message: "Message 30" },
        { id: "30", message: "Duplicate Message 30" },
        { id: "31", message: "Message 31" },
      ];
      await processNotifications(notifications);
      await sleep(200);
      // notificationsSent should only contain unique ids after processing
      const uniqueIds = Array.from(new Set(notificationsSent));
      expect(uniqueIds.length).toBe(notificationsSent.length);
      expect(uniqueIds).toContain("30");
      expect(uniqueIds).toContain("31");
      expect(notificationsSent.length).toBe(2);
      Math.random.mockRestore();
    });

    test("should handle errors gracefully during notification sending", async () => {
      // Force failure for sending by making Math.random() return 0.1
      jest.spyOn(Math, "random").mockReturnValue(0.1);
      const notifications = [{ id: "40", message: "Message 40" }];
      const results = await processNotifications(notifications);
      await sleep(200);
      // Expect an error message for the failed notification
      expect(results.length).toBe(1);
      expect(results[0]).toMatch(/Error sending 40: Network error/);
      Math.random.mockRestore();
    });

    test("should process a large number of notifications without duplicates", async () => {
      // Generate 100 notifications with some duplicates
      const notifications = [];
      for (let i = 0; i < 100; i++) {
        const id = (i % 10).toString(); // Only 10 unique IDs
        notifications.push({ id, message: `Message ${id}` });
      }
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const results = await processNotifications(notifications);
      await sleep(300);
      // Expect 10 unique notifications processed
      expect(results.length).toBe(10);
      // Check that notificationsSent contains only unique IDs
      const uniqueIds = Array.from(new Set(notificationsSent));
      expect(uniqueIds.length).toBe(10);
      Math.random.mockRestore();
    });
  });
});
