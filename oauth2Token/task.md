Base Code 

```javascript
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
```

Prompt
Please I am working on a project that uses OAuth2 tokens for authentication. The OAuth2 token refresh module has runtime errors that cause the system to crash

But currently, the implementation has several bugs that cause runtime errors and not meeting the requirements

1. Off-by-One Expiry Check
   The token expiry logic is triggering refreshes too early or too late, causing errors in token validity.

2. Concurrency Issues:
   When multiple calls to `refreshTokenConditionally` are made concurrently, they all trigger separate refresh operations. This overlapping of refresh requests can lead to inconsistent token updates and runtime errors

3. Error Handling:  
   If the token refresh fails (for example, due to a simulated network error), the function simply rethrows the error, which causes unhandled exceptions. This error handling must be fixed so that the system does not crash

4. Inconsistent Global State Updates:  
   The update of `currentToken` is not handled correctly, causing parts of the application to use an outdated or mismatched token, which results in runtime errors
   
- The update of `currentToken` is not handled correctly
- The getCurrentToken function returns values from undefined variables and always sets expiresAt to 0, instead of returning the actual properties from the current token state

So, after the bug fix, I expect it to do the following

- Return the current access token immediately if it is still valid
- Refresh the token when it is nearly expired when less than 1 second of validity remains by calling the external refresh function.
- Update the global token state with the new token, to make sure that both the access and refresh tokens are consistent
- handle errors appropriately without causing unhandled runtime crashes.

Please fix the bugs in the code and ensure that the module meets the requirements
