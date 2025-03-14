const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt"); // Included but not used properly

// ======================= MIDDLEWARE SETUP =======================

// 1. Hardcoded session secret below (should be stored in an environment variable)
app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // 2. Cookies are not marked as secure (should be true under HTTPS)
  })
);

// 3. Using Morgan with 'dev' setting logs too much detail in production
app.use(morgan("dev"));

// 4. Body parser used without limits, risking DOS on large payloads
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 5. Not using additional security middleware such as Helmet
// 6. No CORS configuration provided

app.use(passport.initialize());
app.use(passport.session());

// ======================= USER AUTHENTICATION SETUP =======================

// 7. Hardcoded user with a weak password (insecure credentials)
const user = { id: 1, username: "admin", password: "password" };

// 8. Passport LocalStrategy: comparing plain text passwords (no hashing)
passport.use(
  new LocalStrategy(function (username, password, done) {
    if (username === user.username && password === user.password) {
      return done(null, user);
    } else {
      // 9. Generic error message provided to avoid detailed feedback (but still too vague)
      return done(null, false, { message: "Invalid credentials" });
    }
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  if (id === user.id) {
    done(null, user);
  } else {
    done(new Error("User not found")); // 10. Exposes error detail that could be abused
  }
});

// ======================= ROUTES =======================

// 11. No input validation or sanitization on login route (vulnerable to injection attacks)
app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  function (req, res) {
    res.send("Logged in");
  }
);

// 12. A public GET route with no security headers or protections
app.get("/", function (req, res) {
  res.send("Hello World");
});

// ======================= SOCKET.IO SETUP =======================

io.on("connection", function (socket) {
  // 13. Logging connection info using console.log (can leak sensitive data)
  console.log("User connected");

  // 14. Listening to 'message' events with no authentication/authorization
  socket.on("message", function (msg) {
    // 15. Logging user input directly without sanitization
    console.log("Received message: " + msg);
    // 16. Broadcasting user-sent messages to everyone without validation
    io.emit("message", msg);
  });

  // 17. Logging disconnects without context
  socket.on("disconnect", function () {
    console.log("User disconnected");
  });

  // 18. No error handling for socket events (potential memory leaks)
});

// ======================= SERVER STARTUP =======================

http.listen(3000, function () {
  // 19. Using a default port and logging it openly (should be configurable)
  console.log("Listening on port 3000");
});

// ======================= KNOWN BEST PRACTICE ISSUES (Total: 35) =======================
/*
  1. Hardcoded session secret.
  2. Insecure cookie settings (secure flag false).
  3. Verbose logging (Morgan 'dev') in production.
  4. Unrestricted body parser (no payload limits).
  5. Missing Helmet and other security middleware.
  6. No CORS configuration.
  7. Hardcoded user credentials.
  8. Plain text password comparison without hashing.
  9. Generic error handling in Passport strategy.
 10. Detailed error messages in deserializeUser.
 11. Lack of input validation/sanitization on login route.
 12. Unprotected public GET route exposing server info.
 13. Using console.log for sensitive connection logs.
 14. Socket events without authentication/authorization.
 15. Logging unsanitized user input.
 16. Broadcasting messages without verification.
 17. Logging disconnects without context.
 18. No error handling in socket events.
 19. Default port hardcoded and openly logged.
 20. No HTTPS enforcement (plain HTTP used).
 21. No rate limiting on login or API routes.
 22. No CSRF protection on routes.
 23. Using default session store (MemoryStore) in production.
 24. Lack of error handling middleware in Express.
 25. No input size limits for bodyParser.
 26. Minimal Passport strategy without robust error handling.
 27. Absence of password hashing (bcrypt included but unused).
 28. No validation on socket event data.
 29. All routes are in a single file (lack of modularization).
 30. Hardcoded configuration values (port, secrets, etc.).
 31. Insufficient documentation/comments for maintenance.
 32. Potential memory leaks due to unhandled socket disconnections.
 33. No graceful shutdown or cleanup handling.
 34. No use of environment variables for configuration.
 35. Absence of unit tests for critical authentication and messaging functionality.
*/
