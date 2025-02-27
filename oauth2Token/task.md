Base Code:
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

Stack Trace:
```javascript
FAIL  ./oauth2Token.test.js
  OAuth2 Token Refresh Module
    × should return the current access token immediately when still valid (10 ms)                                     
    × should refresh the token when less than 1 second of validity remains (8 ms)                                     
    × should throw an error when token refresh fails (3 ms)
    × getCurrentToken returns the actual current token state (1 ms)                                                   
    × concurrent calls to refreshTokenConditionally should result in a single token refresh (2 ms)                    
    × should not refresh token when exactly 1000ms of validity remains (2 ms)                                         
    × concurrent refresh failure: multiple calls should all reject and leave state unchanged (2 ms)                   
    × should attempt a new refresh after a failed refresh (2 ms)                                                      
    × getCurrentToken should return a copy that cannot be mutated externally (1 ms)                                   
    × should maintain original expiry if no refresh is triggered (1 ms)                                               
    × should update token expiry to a new value within expected range after refresh (3 ms)                            
    × should return the same token for multiple sequential calls when still valid (111 ms)                            

  ● OAuth2 Token Refresh Module › should return the current access token immediately when still valid                 

    ReferenceError: accessToken is not defined

      40 |   getCurrentToken: () => {
      41 |     return {
    > 42 |       accessToken: accessToken,
         |                    ^
      43 |       refreshToken: refreshToken,
      44 |       expiresAt: 0,
      45 |     };

      at accessToken (solution.js:42:20)
      at Object.getCurrentToken (oauth2Token.test.js:20:25)

  ● OAuth2 Token Refresh Module › should refresh the token when less than 1 second of validity remains

    ReferenceError: accessToken is not defined

      40 |   getCurrentToken: () => {
      41 |     return {
    > 42 |       accessToken: accessToken,
         |                    ^
      43 |       refreshToken: refreshToken,
      44 |       expiresAt: 0,
      45 |     };

      at accessToken (solution.js:42:20)
      at Object.getCurrentToken (oauth2Token.test.js:45:24)

  ● OAuth2 Token Refresh Module › should throw an error when token refresh fails

    ReferenceError: accessToken is not defined

      40 |   getCurrentToken: () => {
      41 |     return {
    > 42 |       accessToken: accessToken,
         |                    ^
      43 |       refreshToken: refreshToken,
      44 |       expiresAt: 0,
      45 |     };

      at accessToken (solution.js:42:20)
      at Object.getCurrentToken (oauth2Token.test.js:68:19)

  ● OAuth2 Token Refresh Module › getCurrentToken returns the actual current token state

    ReferenceError: accessToken is not defined

      40 |   getCurrentToken: () => {
      41 |     return {
    > 42 |       accessToken: accessToken,
         |                    ^
      43 |       refreshToken: refreshToken,
      44 |       expiresAt: 0,
      45 |     };

      at accessToken (solution.js:42:20)
      at Object.getCurrentToken (oauth2Token.test.js:76:19)

  ● OAuth2 Token Refresh Module › concurrent calls to refreshTokenConditionally should result in a single token refresh

    ReferenceError: accessToken is not defined

      40 |   getCurrentToken: () => {
      41 |     return {
    > 42 |       accessToken: accessToken,
         |                    ^
      43 |       refreshToken: refreshToken,
      44 |       expiresAt: 0,
      45 |     };

      at accessToken (solution.js:42:20)
      at Object.getCurrentToken (oauth2Token.test.js:102:19)

  ● OAuth2 Token Refresh Module › should not refresh token when exactly 1000ms of validity remains

    ReferenceError: accessToken is not defined

      40 |   getCurrentToken: () => {
      41 |     return {
    > 42 |       accessToken: accessToken,
         |                    ^
      43 |       refreshToken: refreshToken,
      44 |       expiresAt: 0,
      45 |     };

      at accessToken (solution.js:42:20)
      at Object.getCurrentToken (oauth2Token.test.js:113:25)

  ● OAuth2 Token Refresh Module › concurrent refresh failure: multiple calls should all reject and leave state unchanged

    ReferenceError: accessToken is not defined

      40 |   getCurrentToken: () => {
      41 |     return {
    > 42 |       accessToken: accessToken,
         |                    ^
      43 |       refreshToken: refreshToken,
      44 |       expiresAt: 0,
      45 |     };

      at accessToken (solution.js:42:20)
      at Object.getCurrentToken (oauth2Token.test.js:160:19)

  ● OAuth2 Token Refresh Module › should attempt a new refresh after a failed refresh

    ReferenceError: accessToken is not defined

      40 |   getCurrentToken: () => {
      41 |     return {
    > 42 |       accessToken: accessToken,
         |                    ^
      43 |       refreshToken: refreshToken,
      44 |       expiresAt: 0,
      45 |     };

      at accessToken (solution.js:42:20)
      at Object.getCurrentToken (oauth2Token.test.js:179:17)

  ● OAuth2 Token Refresh Module › getCurrentToken should return a copy that cannot be mutated externally

    ReferenceError: accessToken is not defined

      40 |   getCurrentToken: () => {
      41 |     return {
    > 42 |       accessToken: accessToken,
         |                    ^
      43 |       refreshToken: refreshToken,
      44 |       expiresAt: 0,
      45 |     };

      at accessToken (solution.js:42:20)
      at Object.getCurrentToken (oauth2Token.test.js:197:20)

  ● OAuth2 Token Refresh Module › should maintain original expiry if no refresh is triggered

    ReferenceError: accessToken is not defined

      40 |   getCurrentToken: () => {
      41 |     return {
    > 42 |       accessToken: accessToken,
         |                    ^
      43 |       refreshToken: refreshToken,
      44 |       expiresAt: 0,
      45 |     };

      at accessToken (solution.js:42:20)
      at Object.getCurrentToken (oauth2Token.test.js:212:25)

  ● OAuth2 Token Refresh Module › should update token expiry to a new value within expected range after refresh       

    ReferenceError: accessToken is not defined

      40 |   getCurrentToken: () => {
      41 |     return {
    > 42 |       accessToken: accessToken,
         |                    ^
      43 |       refreshToken: refreshToken,
      44 |       expiresAt: 0,
      45 |     };

      at accessToken (solution.js:42:20)
      at Object.getCurrentToken (oauth2Token.test.js:242:24)

  ● OAuth2 Token Refresh Module › should return the same token for multiple sequential calls when still valid

    Token refresh failed: Token refresh request failed     

      30 |       return newToken.accessToken;
      31 |     } catch (err) {
    > 32 |       throw new Error("Token refresh failed: " + err.message);
         |             ^
      33 |     }
      34 |   }
      35 |   return currentToken.accessToken;

      at refreshTokenConditionally (solution.js:32:13)     
      at Object.<anonymous> (oauth2Token.test.js:253:20)   

Test Suites: 1 failed, 1 total
Tests:       12 failed, 12 total
Snapshots:   0 total
Time:        1.312 s, estimated 6 s
Ran all test suites.
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
- Refresh the token when it is nearly expired when less than 1 second of validity remains by calling the external refresh function and when it fails, throw error
- Update the global token state with the new token, to make sure that both the access and refresh tokens are consistent


Please fix the bugs in the code and ensure that the module meets the requirements
