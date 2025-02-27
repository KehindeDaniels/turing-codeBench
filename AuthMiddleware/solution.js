const jwt = require("jsonwebtoken");
const express = require("express");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");

const app = express();

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

class Config {
  static SECRET_KEY = process.env.JWT_SECRET || "supersecretkey12345";
  static TOKEN_EXPIRY = "1h";
  static SALT_ROUNDS = 10;
  static JWT_ALGORITHM = "HS256";
}

class UserRepository {
  constructor() {
    this.users = new Map([
      [
        1,
        {
          id: 1,
          username: "Salah",
          role: "admin",
          password: this.hashPassword("admin123"),
        },
      ],
      [
        2,
        {
          id: 2,
          username: "Ali",
          role: "user",
          password: this.hashPassword("user123"),
        },
      ],
      [
        3,
        {
          id: 3,
          username: "Ajiboye",
          role: "analyst",
          password: this.hashPassword("analyst123"),
        },
      ],
    ]);
  }

  hashPassword(password) {
    return bcrypt.hashSync(password, Config.SALT_ROUNDS);
  }

  getUserById(userId) {
    return this.users.get(userId) || null;
  }

  getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  validatePassword(password, hashedPassword) {
    return bcrypt.compareSync(password, hashedPassword);
  }
}

class AuthMiddleware {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  verifyToken = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AuthenticationError("Invalid authorization header");
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, Config.SECRET_KEY, {
        algorithms: [Config.JWT_ALGORITHM],
      });

      const user = this.userRepository.getUserById(decoded.userId);
      if (!user) {
        throw new AuthenticationError("User not found");
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };

  checkRole = (requiredRole) => {
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

  validateRequest = (req, res, next) => {
    if (!req.body || !req.body.username || !req.body.password) {
      throw new AuthenticationError("Missing required fields");
    }
    next();
  };
}

class AuthController {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  login = async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const user = this.userRepository.getUserByUsername(username);

      if (
        !user ||
        !this.userRepository.validatePassword(password, user.password)
      ) {
        throw new AuthenticationError("Invalid credentials");
      }

      const token = jwt.sign({ userId: user.id }, Config.SECRET_KEY, {
        expiresIn: Config.TOKEN_EXPIRY,
        algorithm: Config.JWT_ALGORITHM,
      });

      res.json({ token: `Bearer ${token}` });
    } catch (error) {
      next(error);
    }
  };
}

// Initialize dependencies
const userRepository = new UserRepository();
const authMiddleware = new AuthMiddleware(userRepository);
const authController = new AuthController(userRepository);

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Please try again later." },
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-XSS-Protection": "1; mode=block",
  });
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Internal server error" : err.message;
  res.status(statusCode).json({ error: message });
};

// Configure Express
app.use(express.json());
app.use(securityHeaders);

// Routes
app.post(
  "/login",
  loginLimiter,
  authMiddleware.validateRequest,
  authController.login
);
app.get(
  "/protected",
  authMiddleware.verifyToken,
  authMiddleware.checkRole("admin"),
  (req, res) => {
    res.json({ message: "Access granted to protected route", user: req.user });
  }
);

app.use(errorHandler);

module.exports = {
  app,
  AuthMiddleware,
  AuthController,
  UserRepository,
  Config,
};
