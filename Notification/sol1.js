/**
 * notificationService.js
 *
 * This module simulates a microservice that deduplicates and sends notifications.
 * It intentionally includes many flaws:
 * - Race conditions and improper async handling (using forEach with async callbacks, no proper awaiting).
 * - Global state mismanagement (persistent arrays for sent and pending notifications).
 * - Repeated logic and inconsistent error handling.
 * - Security issues (logging sensitive data, no input validation).
 * - Inefficiencies such as redundant processing and copying.
 *
 * The intended functionality is:
 * 1. Deduplicate notifications by ID.
 * 2. Enqueue notifications for sending.
 * 3. Process the queue asynchronously and update status.
 * 4. Log results (with sensitive details accidentally leaked).
 */

// Global state (poor isolation, potential memory leak)
let notificationsSent = []; // List of IDs for notifications that have been sent
let pendingNotifications = []; // Queue of notifications pending to be sent

/**
 * Simulated asynchronous function to send a notification.
 * Intentional bugs:
 * - Random network failures.
 * - No proper retry or cancellation mechanism.
 * - Always logs sensitive details.
 *
 * @param {Object} notification - Object with properties: id, message, recipient.
 * @returns {Promise<string>}
 */
function sendNotification(notification) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Randomly simulate network failure
      if (Math.random() < 0.25) {
        // Flaw: log internal details on error
        console.error(
          `Failed to send notification ${notification.id} to ${notification.recipient}`
        );
        return reject(new Error("Network error during send"));
      }
      // Flaw: No duplicate check; always push to global array even if already sent
      notificationsSent.push(notification.id);
      // Flaw: Sensitive details logged
      console.log(
        `Sent notification [ID: ${notification.id}, To: ${notification.recipient}, Message: ${notification.message}]`
      );
      return resolve(`Notification ${notification.id} sent successfully`);
    }, 75);
  });
}

/**
 * Deduplicates notifications based on the 'id' property.
 * Bug: The function works, but it is defined twice in this module (duplicate logic).
 *
 * @param {Array} notifications - Array of notification objects.
 * @returns {Array} Deduplicated array.
 */
function deduplicateNotifications(notifications) {
  const seen = {};
  const deduped = [];
  for (let i = 0; i < notifications.length; i++) {
    let notif = notifications[i];
    if (!notif || !notif.id) continue; // Flaw: missing robust validation
    if (!seen[notif.id]) {
      seen[notif.id] = true;
      deduped.push(notif);
    }
  }
  return deduped;
}

/**
 * Duplicate implementation of deduplication (intentionally repeated).
 *
 * @param {Array} notifications - Array of notification objects.
 * @returns {Array} Deduplicated array.
 */
function dedupeNotifications(notifications) {
  let unique = [];
  notifications.forEach((n) => {
    if (n && !unique.find((x) => x.id === n.id)) {
      unique.push(n);
    }
  });
  return unique;
}

/**
 * Enqueues notifications for sending.
 * Bug: Appends to a global pendingNotifications array without any locking or validation.
 *
 * @param {Array} notifications - Array of notification objects.
 */
function queueNotifications(notifications) {
  // Flaw: does not deduplicate; simply pushes all notifications
  notifications.forEach((n) => {
    pendingNotifications.push(n);
  });
}

/**
 * Processes all pending notifications.
 * Bugs:
 * - Uses forEach with async callbacks without proper awaiting.
 * - Duplicate processing: calls deduplication twice in slightly different ways.
 * - Inconsistent error propagation: errors in sending are caught locally and logged, but not aggregated.
 * - Global state (pendingNotifications) is not cleared reliably.
 *
 * @returns {Promise<Array>} Array of result messages.
 */
async function processNotifications() {
  // Intentional redundancy: deduplicate pending notifications twice
  let deduped1 = deduplicateNotifications(pendingNotifications);
  let deduped2 = dedupeNotifications(deduped1);

  let results = [];
  // Using forEach with async callbacks (bug: does not wait for promises)
  deduped2.forEach(async (notif) => {
    try {
      let result = await sendNotification(notif);
      results.push(result);
      // Flaw: update notification status without proper confirmation
      notif.status = "sent";
    } catch (err) {
      // Flaw: Inconsistent error handling; error messages include sensitive details
      results.push(`Error for ${notif.id}: ${err.message}`);
      notif.status = "failed";
    }
  });
  // Bug: immediately return results without waiting for all sends to complete.
  return results;
}

/**
 * Clears global states.
 * Bug: This function is never called in production, leading to memory bloat.
 */
function clearGlobalStates() {
  notificationsSent = [];
  pendingNotifications = [];
}

/**
 * Retrieves the current global state for testing purposes.
 *
 * @returns {Object} - An object with notificationsSent and pendingNotifications.
 */
function getGlobalState() {
  return {
    notificationsSent,
    pendingNotifications,
  };
}

module.exports = {
  sendNotification,
  deduplicateNotifications,
  dedupeNotifications,
  queueNotifications,
  processNotifications,
  clearGlobalStates,
  getGlobalState,
};
