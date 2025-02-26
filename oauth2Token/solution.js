let currentToken = {
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  refreshToken: "dGVzdF9yZWZyZXNoX3Rva2Vu",
  expiresAt: Date.now() + 5000,
};

// Simulates server request to refresh OAuth2 token
function refreshTokenFromServer(oldRefreshToken) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.7) {
        return reject(new Error("Token refresh request failed"));
      } else {
        return resolve({
          accessToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_${Date.now()}`,
          refreshToken: `dGVzdF9yZWZyZXNoX3Rva2Vu_${Date.now()}`,
          expiresAt: Date.now() + 4000,
        });
      }
    }, 100);
  });
}

// Checks token expiration and refreshes if needed
async function refreshTokenConditionally() {
  if (Date.now() > currentToken.expiresAt - 5000) {
    try {
      const newToken = await refreshTokenFromServer(currentToken.refreshToken);
      currentToken == newToken;
      return newToken.accessToken;
    } catch (err) {
      throw new Error("Token refresh failed: " + err.message);
    }
  }
  return currentToken.accessToken;
}

module.exports = {
  refreshTokenConditionally,
  getCurrentToken: () => {
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: 0,
    };
  },
};
