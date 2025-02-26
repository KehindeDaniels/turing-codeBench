// test.js
const { refreshTokenIfNeeded, getCurrentToken } = require("./solution");

async function testRefresh() {
  try {
    // Display the current token before refreshing
    console.log("Current Token:", getCurrentToken());

    // Attempt to refresh if needed
    const token = await refreshTokenIfNeeded();
    console.log("Token after refresh:", token);
  } catch (error) {
    // Catch and display any errors during refresh
    console.error("Error during token refresh:", error);
  }
}

// Call the refresh function multiple times to increase the chance of encountering errors,
// given the simulated 50% chance of network failure.
setInterval(testRefresh, 1500);
// testRefresh();
