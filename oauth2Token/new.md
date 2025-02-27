```javascript
● OAuth2 Token Refresh Module › should not refresh token when exactly 1000ms of validity remains                    

    Error during token refresh: Token refresh failed: Token refresh request failed

      56 |     return currentToken.accessToken;
      57 |   } catch (error) {
    > 58 |     throw new Error(`Error during token refresh: ${error.message}`);
         |           ^
      59 |   }
      60 | }
      61 |

      at refreshTokenConditionally (solution.js:58:11)     
      at Object.<anonymous> (oauth2Token.test.js:119:25)   

```
- The code fails because It incorrectly triggers a refresh when exactly 1000 ms remain by using a condition of `timeUntilExpiry <= 1000` instead of `timeUntilExpiry < 1000`, which does not meet the requirement to refresh only when less than 1 second remains.

```javascript
 ● OAuth2 Token Refresh Module › concurrent refresh failure: multiple calls should all reject and leave state unchanged

    expect(received).rejects.toThrow()

    Received promise resolved instead of rejected
    Resolved to value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"

      154 |     // All promises should reject.
      155 |     for (const p of promises) {
    > 156 |       await expect(p).rejects.toThrow();       
          |             ^
      157 |     }
      158 |
      159 |     // Global state remains unchanged.

      at expect (node_modules/expect/build/index.js:113:15)
      at Object.expect (oauth2Token.test.js:156:13)   
```

- The code fails because it does not follow the task requirement that the token should only be refreshed when less than 1 second of validity remains. The model uses the condition `timeUntilExpiry <= 1000`, which means that even when there is exactly 1000 ms left, the code will trigger a refresh and since `Math.random()` can cause `refreshTokenFromServer` to fail, the error "Token refresh request failed" is thrown

- The code fails because It  triggers a refresh when exactly 1000 ms remain by using a condition of `timeUntilExpiry <= 1000` instead of `timeUntilExpiry < 1000`, which does not meet the requirement to refresh only when less than 1 second remains.


```javascript
● OAuth2 Token Refresh Module › getCurrentToken should return a copy that cannot be mutated externally              

    expect(received).toBe(expected) // Object.is equality  

    Expected: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"       
    Received: "mutated_value"

      203 |     // A subsequent call to getCurrentToken should return the original internal state.
      204 |     const token2 = getCurrentToken();
    > 205 |     expect(token2.accessToken).toBe(INITIAL_ACCESS_TOKEN);
          |                                ^
      206 |     expect(token2.refreshToken).toBe(INITIAL_REFRESH_TOKEN);
      207 |     expect(token2.expiresAt).toBeGreaterThan(Date.now());
      208 |   });

      at Object.toBe (oauth2Token.test.js:205:32)
```

- The model fails because it returned the actual `currentToken` object rather than a copy, such that when an external code mutates the object returned by `getCurrentToken`, the internal state is also changed and mutated

```javascript
● OAuth2 Token Refresh Module › should refresh the token when less than 1 second of validity remains                

    expect(received).toMatch(expected)

    Expected pattern: /^dGVzdF9yZWZyZXNoX3Rva2Vu_/
    Received string:  "dGVzdF9yZWZyZXNoX3Rova2Vu_1740578940943"

      45 |     const tokenAfter = getCurrentToken();       
      46 |     expect(tokenAfter.accessToken).toBe(newAccessToken);
    > 47 |     expect(tokenAfter.refreshToken).toMatch(    
         |                                     ^
      48 |       new RegExp(`^${INITIAL_REFRESH_TOKEN}_`)  
      49 |     );
      50 |     expect(tokenAfter.expiresAt).toBeGreaterThan(Date.now());

      at Object.toMatch (oauth2Token.test.js:47:37)  
```
- The code fails because the new refresh token's format does not match the expected pattern derived from the initial refresh token. The model builds the new refresh token as `dGVzdF9yZWZyZXNoX3Rva2Vu_ + Date.now()`, but the initial token’s refresh token has an extra `o`. This mismatch is what is causing the regular expression check to fail

```javascript
● OAuth2 Token Refresh Module › concurrent refresh failure: multiple calls should all reject and leave state unchanged

    expect(received).rejects.toThrow()

    Received promise resolved instead of rejected
    Resolved to value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"

      154 |     // All promises should reject.
      155 |     for (const p of promises) {
    > 156 |       await expect(p).rejects.toThrow();       
          |             ^
      157 |     }
      158 |
      159 |     // Global state remains unchanged.

      at expect (node_modules/expect/build/index.js:113:15)
      at Object.expect (oauth2Token.test.js:156:13)   
```
- The model’s approach of waiting in a loop and then returning the current token is causing some calls to resolve instead of rejecting with an error. This does not follow the task requirement that, on a refresh failure, all calls to `refreshTokenConditionally` should throw an error and the global state should remain unchanged



The failure occurs because the solution is triggering refresh even when exactly 1000 ms remain, bit the prompt explicitly requires that a refresh occurs only when less than 1 second `< 1000 ms` remains.

- The error occurred because in the `refreshTokenConditionally` function, it uses this condition:
```javascript
if (now < currentToken.expiresAt - 1000) {
    return currentToken.accessToken;
}
```
when the remaining time is exactly 1000ms, the condition now < currentToken.expiresAt - 1000 evaluates to false because `currentToken.expiresAt - now === 1000` is not greater than 1000.  So, the code attempts to refresh the token when there is exactly 1000ms remaining 

- When exactly 1000ms remain, triggering a refresh is not expected by the tests. But the model refresesh at exactly 1 second, so, when the refresh fails, the test throws an error


- The module should refresh the token only when there is less than 1000ms, When there is exactly 1000ms remaining, it should not trigger a refresh. But the code when the remaining time is exactly 1000ms, the condition `now < currentToken.expiresAt - 1000` evaluates to false because `currentToken.expiresAt - now === 1000` is not greater than 1000 so the code attempts to refresh the token when there is exactly 1000ms remaining, making it to fail

- The comment "Refresh occurs only if the token has < 1s of validity left" was not properly implemented
The condition
```javascript
if (Date.now() < currentToken.expiresAt - 1000) {
  return currentToken.accessToken;
}

```
is same as saying `if ((currentToken.expiresAt - Date.now()) > 1000)`
at any point `currentToken.expiresAt - Date.now()` is equal 1000ms, then the condition becomes `if (1000 > 1000)` which is false. And the code does not return a token but goes ahead to refresh the token.





- In the Off-by-One Expiry Check, the condition is changed from `if (Date.now() > currentToken.expiresAt - 1000)` to `if (Date.now() <= currentToken.expiresAt - 1000)` By using `<=` for the valid period, the function only triggers a refresh when less than 1 second remains, perfectly matching the requirement

- The Incorrect solution did not manage concurrency as each call to `refreshTokenConditionally` would independently trigger a refresh when needed, which can lead to multiple overlapping refresh operations, potentially causing inconsistent token state. But in the ideal response, by using a shared promise `refreshPromise`,  if a refresh is already in progress, all concurrent calls wait for that same promise to resolve avoiding redundant refresh calls and ensures that the global token state is updated only once

- The incorrect version just rethrew the error from the refresh without ensuring that the global state remains unchanged on failure. But in this correct solution, the refresh failure is caught and a new error is thrown. Since the update to `currentToken` only happens on a successful refresh, the global state remains unchanged if an error occurs

- This ideal response uses the spread operator to return a shallow copy of currentToken ensures that external modifications do not affect the internal state
