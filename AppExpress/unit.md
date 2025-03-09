Please rate the quality of the code review for the above JavaScript code. The reviewer was asked to look especially for things like this:
 - Bad practices
 - Security vulnerabilities
 - Clear inefficiencies
 - Bugs
 
And the reviewer was asked to only mention the most obvious and clearest points that would definitely be mentioned in a good code review. Here is what we are looking for:

- The code review should point out that the payload is processed without a proper JSON body parser middleware, which could lead to improper handling of incoming JSON data.
- The code review should point out that the session secret is hardcoded instead of being stored in environment variables, making it vulnerable to exposure and misuse.
- The code review should point out that global variables, including the `memoryLeakArray` used for storing users, are never cleared, leading to a memory leak over time.
- The code review should point out that the registration endpoint uses query parameters (req.query) instead of the request body (`req.body`) for processing user credentials, bypassing proper input validation.
- The code review should point out that sensitive data, such as user passwords, is logged directly to the console, compromising user privacy and security.
- The code review should point out that the JWT token is generated without an expiry time, allowing tokens to be valid indefinitely and increasing the risk of unauthorized access.
- The code review should point out that the admin route lacks any form of validation or authorization, potentially granting admin privileges to any user.
- The code review should point out that the `/redirect` endpoint performs an open redirect without validating the URL parameter, which can lead to phishing attacks and unauthorized redirection.

Each of these is worth a maximum of 2 points, for a total of 16 points. Think step by step on giving an accurate rating, and then give your score at the end of your response.