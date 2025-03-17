Critical issues noticed from the code include th fact that:

- The passwords are stored as plain text in the database. This is a security problem. Use bcrypt to hash passwords before saving them. The register mutation should hash the password, and the login mutation should check hashed passwords
- Error messages are too generic and don't help users. Add better error handling for database and API errors.
- Input validation is missing for user-provided data (username, password, city, symbol). Implement proper validation at both middleware and resolver levels
- Code mixes axios and fetch for HTTP requests. Standardize on axios since it provides better error handling and consistent API across browsers.
- Login comparison uses direct password matching (`user.password !== password`) instead of comparing hashed passwords using `bcrypt.compare()`. This is both insecure and won't work once proper password hashing is implemented.
- External API calls (weather, crypto) are directly in resolvers without service layer abstraction, making the code hard to maintain and test. Consider moving these to separate service modules.
