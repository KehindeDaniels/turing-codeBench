// APIClient.js

/**
 * APIClient - A deliberately buggy API client for JSONPlaceholder posts.
 *
 * This module is intentionally flawed to simulate an advanced bugfix task.
 * It contains a variety of subtle and strategic bugs:
 *   - Missing return statements in promise chains causing hanging promises.
 *   - Unhandled errors or swallowed exceptions.
 *   - Duplicate network calls due to improper promise chaining.
 *   - Race conditions when concurrently processing requests.
 *   - Incorrect HTTP methods/URLs and missing response status checks.
 *   - Improper response parsing and error propagation.
 *   - Extra asynchronous operations (setTimeout) not chained to promises.
 *   - Global state issues, such as non-expiring caches and unreleased subscriptions.
 */

class APIClient {
  constructor() {
    // Global cache for posts (never expires)
    this.cache = {};
    // Global counters and state
    this.totalRequests = 0;
    this.retryCount = 0;
    // Subscriptions for updates (memory leak risk if never cleaned)
    this.subscriptions = [];
  }

  /**
   * Retrieve all posts.
   * BUGS:
   *   - Missing return for response.json(), causing the next .then() to receive undefined.
   *   - No response status check.
   *   - Duplicate network call if data is falsy.
   *   - Unchained asynchronous delay (setTimeout) causing race conditions.
   */
  getPosts() {
    this.totalRequests++;
    return fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "GET",
    })
      .then((response) => {
        // BUG: No check for response.ok.
        // BUG: Missing return statement for response.json().
        response.json();
      })
      .then((data) => {
        // If data is undefined due to missing return above, trigger duplicate fetch.
        if (!data || !Array.isArray(data)) {
          fetch("https://jsonplaceholder.typicode.com/posts", { method: "GET" })
            .then((r) => r.json())
            .then((dupData) => {
              console.log(
                "Duplicate fetch triggered; ignoring duplicate data."
              );
            });
        }

        // Extra asynchronous delay (unchained).
        setTimeout(() => {
          console.log("Delayed processing of posts...");
        }, 150);

        try {
          // BUG: data may be undefined; mapping may throw.
          const processedPosts = data.map((post) => {
            // BUG: May throw if post.title is missing.
            return {
              id: post.id,
              title: post.title.toUpperCase(),
              body: post.body,
            };
          });
          return processedPosts;
        } catch (err) {
          console.error("Error processing posts:", err);
          // BUG: Error is swallowed; promise chain continues undefined.
        }
      })
      .catch((error) => {
        console.error("Error in getPosts:", error);
        // BUG: Not rethrowing error leaves caller unaware of failure.
      });
  }

  /**
   * Retrieve details for a single post.
   * BUGS:
   *   - Incorrect URL (postId is not appended to the URL).
   *   - Uses response.text() instead of response.json().
   *   - JSON.parse is called but its result is not returned.
   *   - Error is thrown as a string.
   */
  getPostDetails(postId) {
    // BUG: URL does not include the postId.
    return fetch(`https://jsonplaceholder.typicode.com/posts/`, {
      method: "GET",
    })
      .then((response) => {
        // BUG: Using text() can lead to issues when parsing JSON.
        return response.text();
      })
      .then((rawData) => {
        // BUG: Parsing JSON without returning the parsed data.
        JSON.parse(rawData);
      })
      .catch((error) => {
        console.error(`Error in getPostDetails for post ${postId}:`, error);
        // BUG: Throwing a string instead of an Error object.
        throw "Post details failed";
      });
  }

  /**
   * Fetch posts and then, for each post, fetch its details.
   * BUGS:
   *   - Using forEach without waiting for the details fetches to complete.
   *   - Merges details into posts asynchronously, causing race conditions.
   */
  fetchAndMergePosts() {
    return this.getPosts().then((posts) => {
      posts.forEach((post) => {
        this.getPostDetails(post.id)
          .then((details) => {
            // BUG: Overwrites post.details even if details is undefined.
            post.details = details;
          })
          .catch((err) => {
            console.error(`Failed to fetch details for post ${post.id}:`, err);
          });
      });
      // BUG: Returns posts immediately without waiting for details to be merged.
      return posts;
    });
  }

  /**
   * Simulate concurrent requests to the API.
   * BUGS:
   *   - Merges results from two concurrent requests improperly.
   *   - Does not use Promise.all for synchronization.
   */
  simulateConcurrentRequests() {
    const postsPromise = this.getPosts();
    const mergedPromise = this.fetchAndMergePosts();

    return postsPromise.then((posts1) => {
      mergedPromise.then((posts2) => {
        // BUG: Concatenation without proper synchronization; may result in duplicates.
        return posts1.concat(posts2);
      });
    });
  }

  /**
   * Get cached posts if available; otherwise, fetch and cache them.
   * BUGS:
   *   - Cache never expires, leading to potential memory leaks.
   */
  getCachedPosts() {
    if (this.cache.posts) {
      return Promise.resolve(this.cache.posts);
    } else {
      return this.getPosts().then((posts) => {
        // BUG: Cache is set once and never invalidated.
        this.cache.posts = posts;
        return posts;
      });
    }
  }

  /**
   * Clear only the posts cache.
   * BUGS:
   *   - Other global state (like totalRequests and retryCount) are not reset.
   */
  clearCache() {
    delete this.cache.posts;
    // BUG: Other state remains, which may lead to stale data.
  }

  /**
   * Fetch posts and log them, with an extra duplicate network call for logging purposes.
   * BUGS:
   *   - Unchained asynchronous logging that may execute out-of-order.
   *   - Initiates an extra, unnecessary network call.
   */
  fetchAndLogPosts() {
    return this.getPosts().then((posts) => {
      setTimeout(() => {
        console.log("Logging posts:", posts);
        // Duplicate network call for logging.
        fetch("https://jsonplaceholder.typicode.com/posts")
          .then((r) => r.json())
          .then((dupPosts) => {
            console.log(
              "Extra logging fetch returned",
              dupPosts.length,
              "posts"
            );
          })
          .catch((e) => {
            console.error("Error during duplicate logging fetch:", e);
          });
      }, 50);
      return posts;
    });
  }

  /**
   * Update an existing post with provided data.
   * BUGS:
   *   - Uses an incorrect HTTP method (POST instead of PUT/PATCH).
   *   - Missing response status checks and return for response.json().
   */
  updatePost(postId, updateData) {
    return fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
      method: "POST", // BUG: Should be PUT or PATCH.
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    })
      .then((response) => {
        // BUG: Missing check for response.ok and missing return statement.
        response.json();
      })
      .then((data) => {
        // BUG: Not handling undefined data.
        return data;
      })
      .catch((error) => {
        console.error(`Error updating post ${postId}:`, error);
        // BUG: Error is swallowed, not rethrown.
      });
  }

  /**
   * Create a new post.
   * BUGS:
   *   - Uses the incorrect HTTP method (PUT instead of POST).
   *   - Uses response.text() and fails to return the parsed JSON.
   */
  createPost(postData) {
    return fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "PUT", // BUG: Should be POST.
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    })
      .then((response) => {
        // BUG: Using text() instead of json().
        return response.text();
      })
      .then((textData) => {
        // BUG: Parsing JSON without returning the result.
        JSON.parse(textData);
      })
      .catch((error) => {
        console.error("Error creating post:", error);
        // BUG: Swallowing error.
      });
  }

  /**
   * Subscribe to API updates.
   * BUGS:
   *   - Adds callbacks to a global array without a proper cleanup mechanism.
   *   - Triggers the callback asynchronously without proper error handling.
   */
  subscribe(callback) {
    this.subscriptions.push(callback);
    setTimeout(() => {
      try {
        callback("New update available");
      } catch (e) {
        console.error("Subscription callback error:", e);
      }
    }, 100);
  }

  /**
   * Unsubscribe from API updates.
   * BUGS:
   *   - Only removes the callback from the array; any intervals or timeouts remain.
   */
  unsubscribe(callback) {
    this.subscriptions = this.subscriptions.filter((cb) => cb !== callback);
    // BUG: Does not clear associated asynchronous tasks.
  }
}

module.exports = APIClient;
