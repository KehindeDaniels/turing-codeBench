I am developing a notification service, but the current implementation is failing several tests due to bugs as seen in the stack trace above

- Duplicate notifications are sent for exact duplicates instead of only one
- Processing the same notifications at once can cause them to be sent multiple times
- The cache is not updated in time, and it is resulting in a `sentCount` that is too high or the cache remains empty when it should be set
- The service does not handle an empty notifications array properly it incorrectly logs duplicate sends
- Processing of notifications with numeric userIds is treated incorrectly duplicates are sent
- Some tests exceed timeouts due to asynchronous operations not resolving as expected

Please fix the bugs in the code so that
- For duplicate notifications, only a single notification is sent and logged.
- When processing notifications at the same time, duplicates should be removed and only unique notifications counted
- The cache updates quickly and correctly to prevent sending the same notification twice.
- The service should handle an empty array of notifications without logging any sends
- Numeric userIds should be properly normalized in the cache key so that duplicates are not sent.

