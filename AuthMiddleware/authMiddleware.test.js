const request = require("supertest");
const jwt = require("jsonwebtoken");
const { app, getUserById } = require("./solution");

const SECRET_KEY = "supersecretkey12345";

describe("Express Authentication Middleware", () => {
  /**
   * /login Endpoint Tests
   */
  describe("/login endpoint", () => {
    test("should login successfully for valid admin user", async () => {
      const response = await request(app)
        .post("/login")
        .send({ username: "alice", password: "any" });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("token");

      // Verify token payload contains the correct userId
      const decoded = jwt.verify(response.body.token, SECRET_KEY);
      expect(decoded).toHaveProperty("userId", 1);
    });

    test("should fail login for an invalid username", async () => {
      const response = await request(app)
        .post("/login")
        .send({ username: "nonexistent", password: "any" });
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("error", "Invalid credentials.");
    });

    test("should fail login when provided unsanitized or malformed input", async () => {
      // Since input sanitization is missing, an injection-like string should fail if it doesn't match
      const response = await request(app)
        .post("/login")
        .send({ username: "alice; DROP TABLE users", password: "any" });
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("error", "Invalid credentials.");
    });
  });

  /**
   * /protected Endpoint Tests
   */
  describe("/protected endpoint", () => {
    test("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/protected");
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty("error", "No token provided.");
    });

    test("should return 401 for an invalid token", async () => {
      const response = await request(app)
        .get("/protected")
        .set("authorization", "invalidtoken");
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toMatch(/Token verification failed/);
    });

    test("should return 404 if token is valid but the user is not found", async () => {
      // Create a valid token for a non-existent user (userId 999)
      const fakeToken = jwt.sign({ userId: 999 }, SECRET_KEY);
      const response = await request(app)
        .get("/protected")
        .set("authorization", fakeToken);
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty("error", "User not found.");
    });

    test("should return 403 if a valid token is provided for a non-admin user", async () => {
      // Login with a non-admin user; "bob" is assigned the role "user"
      const loginResponse = await request(app)
        .post("/login")
        .send({ username: "bob", password: "any" });
      expect(loginResponse.statusCode).toBe(200);
      const token = loginResponse.body.token;

      const response = await request(app)
        .get("/protected")
        .set("authorization", token);
      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty(
        "error",
        "Access denied. admin role required."
      );
    });

    test("should return 200 for a valid admin user", async () => {
      // Login with the admin user "alice"
      const loginResponse = await request(app)
        .post("/login")
        .send({ username: "alice", password: "any" });
      expect(loginResponse.statusCode).toBe(200);
      const token = loginResponse.body.token;

      const response = await request(app)
        .get("/protected")
        .set("authorization", token);
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "You have accessed a protected route."
      );
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("username", "alice");
    });
  });

  /**
   * getUserById Function Tests
   */
  describe("getUserById function", () => {
    test("should return the correct user for an existing id", () => {
      const user = getUserById(1);
      expect(user).not.toBeNull();
      expect(user.username).toBe("alice");
    });

    test("should return null for a non-existent user id", () => {
      const user = getUserById(999);
      expect(user).toBeNull();
    });
  });
});
