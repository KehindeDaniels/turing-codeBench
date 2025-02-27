/* oauth2Token.js */

let currentToken = {
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  refreshToken: "dGVzdF9yZWZyZXNoX3Rva2Vu",
  // Assume it's valid for 5 seconds from the time of module load
  expiresAt: Date.now() + 5000,
};

// Simulated token-refresh server call
function refreshTokenFromServer(oldRefreshToken) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // With probability 0.7, simulate a refresh error:
      if (Math.random() < 0.7) {
        return reject(new Error("Token refresh request failed"));
      }
      // Otherwise, return a newly minted token:
      return resolve({
        accessToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_${Date.now()}`,
        refreshToken: `dGVzdF9yZWZyZXNoX3Rva2Vu_${Date.now()}`,
        // Give the new token about 4 seconds of validity
        expiresAt: Date.now() + 4000,
      });
    }, 100);
  });
}

/*
  We need to ensure:
    - Refresh occurs only if the token has < 1s of validity left.
    - If a refresh is already running, concurrent calls should await the same Promise.
    - If the refresh fails, the global token remains unchanged.
*/

// Tracks any ongoing refresh attempt:
let refreshPromise = null;

async function refreshTokenConditionally() {
  // If more than 1 second of validity remains, return the existing access token
  if (Date.now() < currentToken.expiresAt - 1000) {
    return currentToken.accessToken;
  }

  // If we already have a refresh operation in progress, wait on it
  if (refreshPromise) {
    return refreshPromise
      .then(() => currentToken.accessToken)
      .catch((err) => {
        // The original throw is re-thrown here so that concurrent callers also see the error
        throw err;
      });
  }

  // No refresh is in progress; begin a new one
  refreshPromise = refreshTokenFromServer(currentToken.refreshToken)
    .then((newToken) => {
      // ONLY update global token if refresh succeeded
      currentToken = {
        accessToken: newToken.accessToken,
        refreshToken: newToken.refreshToken,
        expiresAt: newToken.expiresAt,
      };
      return currentToken.accessToken;
    })
    .catch((err) => {
      // Do NOT modify global token if refresh fails
      throw new Error("Token refresh failed: " + err.message);
    })
    .finally(() => {
      // Clear the in-progress refresh marker
      refreshPromise = null;
    });

  // Return the same Promise so concurrent calls wait for this single refresh
  return refreshPromise;
}

/*
  getCurrentToken should return a copy of currentToken so that the caller
  cannot mutate the token directly.
*/
function getCurrentToken() {
  return {
    accessToken: currentToken.accessToken,
    refreshToken: currentToken.refreshToken,
    expiresAt: currentToken.expiresAt,
  };
}

module.exports = {
  refreshTokenConditionally,
  getCurrentToken,
};
