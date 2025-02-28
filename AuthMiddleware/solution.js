const jwt = require("jsonwebtoken");
const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();

// Configuration
const config = {
  JWT_SECRET: process.env.JWT_SECRET || "supersecretkey12345",
  TOKEN_EXPIRY: "1h",
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100,
};

// Custom error types
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = 401;
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = 403;
  }
}

// Optimized user storage
const usersMap = new Map([
  [1, { id: 1, username: "Salah", role: "admin" }],
  [2, { id: 2, username: "Ali", role: "user" }],
  [3, { id: 3, username: "Ajiboye", role: "analyst" }],
]);

const usersByUsername = new Map(
  Array.from(usersMap.values()).map((user) => [user.username, user])
);

// Rate limiting middleware
const loginLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: { error: "Too many login attempts. Please try again later." },
});

// Request validation middleware
const validateLoginRequest = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    throw new AuthenticationError("Username and password are required.");
  }
  if (typeof username !== "string" || typeof password !== "string") {
    throw new AuthenticationError("Invalid input format.");
  }
  next();
};

// Token validation middleware
const validateTokenFormat = (token) => {
  if (!token || !token.startsWith("Bearer ")) {
    throw new AuthenticationError("Invalid token format.");
  }
  return token.split(" ")[1];
};

// User retrieval function
const getUserById = (userId) => {
  const user = usersMap.get(Number(userId));
  if (!user) {
    throw new AuthenticationError("User not found.");
  }
  return user;
};

// Token verification middleware
const verifyToken = (req, res, next) => {
  try {
    const token = validateTokenFormat(req.headers.authorization);
    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (err) {
        throw new AuthenticationError(
          `Token verification failed: ${err.message}`
        );
      }
      req.user = getUserById(decoded.userId);
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Role verification middleware
const checkUserRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      if (!req.user || req.user.role !== requiredRole) {
        throw new AuthorizationError(
          `Access denied. ${requiredRole} role required.`
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Login handler
const loginHandler = async (req, res, next) => {
  try {
    const { username } = req.body;
    const user = usersByUsername.get(username);

    if (!user) {
      throw new AuthenticationError("Invalid credentials.");
    }

    const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, {
      expiresIn: config.TOKEN_EXPIRY,
    });

    res.json({
      token,
      type: "Bearer",
      expiresIn: config.TOKEN_EXPIRY,
    });
  } catch (error) {
    next(error);
  }
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    error: {
      message,
      type: err.name,
    },
  });
};

// Route setup
app.use(express.json());
app.post("/login", loginLimiter, validateLoginRequest, loginHandler);
app.get("/protected", verifyToken, checkUserRole("admin"), (req, res) => {
  res.json({ message: "Access granted to protected route", user: req.user });
});
app.use(errorHandler);

module.exports = {
  verifyToken,
  checkUserRole,
  loginHandler,
  getUserById,
  app,
};
