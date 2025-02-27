/**
 * authMiddleware.test.js
 * Comprehensive unit tests for the Express authentication middleware.
 */

const request = require("supertest");
const jwt = require("jsonwebtoken");
const express = require("express");
const bodyParser = require("body-parser");

// Import the app and helper function from our module.
const { app, getUserById, loginHandler } = require("./solution");

// Since our module uses a hard-coded secret key, we assume we know it:
const SECRET_KEY = "supersecretkey12345";

// Helper: generate a JWT for a given userId (simulate login tokens)
function generateToken(userId, options = {}) {
  // In the updated code, tokens might include expiration; for tests, we simulate a valid token.
  return jwt.sign({ userId }, SECRET_KEY, options);
}

// Extend the app with JSON parsing for test requests
const testApp = express();
testApp.use(bodyParser.json());
testApp.use(app);

describe("Express Authentication Middleware - Comprehensive Tests", () => {
  // --- Tests for the /login endpoint ---
  describe("POST /login", () => {
    test('should return a token for valid credentials (e.g., "alice")', async () => {
      const response = await request(testApp)
        .post("/login")
        .send({ username: "alice", password: "anyvalue" });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("token");
      // Verify token structure using jwt.verify (should not throw)
      const decoded = jwt.verify(response.body.token, SECRET_KEY);
      expect(decoded).toHaveProperty("userId");
    });

    test("should return 401 for invalid credentials (unknown user)", async () => {
      const response = await request(testApp)
        .post("/login")
        .send({ username: "nonexistent", password: "anyvalue" });
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("error", "Invalid credentials.");
    });

    test("should return 401 if username is missing", async () => {
      const response = await request(testApp)
        .post("/login")
        .send({ password: "anyvalue" });
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  // --- Tests for the /protected endpoint ---
  describe("GET /protected", () => {
    test("should return 401 if no Authorization header is provided", async () => {
      const response = await request(testApp).get("/protected");
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("error", "No token provided.");
    });

    test("should return 401 if an invalid token is provided", async () => {
      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", "invalidtoken");
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("error");
      // Optionally check that error message contains a mention of token verification failure.
      expect(response.body.error).toMatch(/Token verification failed/);
    });

    test('should return 403 for valid token with non-admin role (e.g., "bob")', async () => {
      // Simulate login as bob (non-admin). According to our usersDb, bob has role 'user'.
      // We generate a token with bob's userId (2).
      const token = generateToken(2);
      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", token);
      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty(
        "error",
        "Access denied. admin role required."
      );
    });

    test('should return 200 and protected data for valid token with admin role ("alice")', async () => {
      // Simulate login as alice (admin, userId 1).
      const token = generateToken(1);
      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", token);
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "You have accessed a protected route."
      );
      expect(response.body).toHaveProperty("user");
      // Ensure that the returned user has admin role.
      expect(response.body.user).toHaveProperty("role", "admin");
    });
  });

  // --- Direct Unit Tests for Helper Functions ---
  describe("Helper Function: getUserById", () => {
    test("should return the correct user object for an existing user", () => {
      const user = getUserById(1);
      expect(user).not.toBeNull();
      expect(user).toHaveProperty("username", "alice");
    });

    test("should return null for a non-existent user", () => {
      const user = getUserById(9999);
      expect(user).toBeNull();
    });
  });

  // --- Testing Error Handling & Input Sanitization ---
  describe("Error Handling and Input Sanitization", () => {
    test("should reject a request with an empty token header", async () => {
      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", "");
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("error", "No token provided.");
    });

    test("should handle malformed tokens gracefully", async () => {
      const malformedToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.thisisnotproperly.formed";
      const response = await request(testApp)
        .get("/protected")
        .set("Authorization", malformedToken);
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("error");
      // The error message should indicate token verification failure.
      expect(response.body.error).toMatch(/Token verification failed/);
    });
  });

  // --- Simulated Concurrency (Optional) ---
  describe("Simulated Concurrency (Role-Validation Consistency)", () => {
    test("concurrent requests with valid admin tokens should all succeed consistently", async () => {
      const token = generateToken(1);
      const concurrentRequests = [];
      for (let i = 0; i < 10; i++) {
        concurrentRequests.push(
          request(testApp).get("/protected").set("Authorization", token)
        );
      }
      const responses = await Promise.all(concurrentRequests);
      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty(
          "message",
          "You have accessed a protected route."
        );
      });
    });
  });
});
