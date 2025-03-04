class APIClient {
  constructor() {
    this.cache = {};
    this.totalRequests = 0;
    this.retryCount = 0;
    this.subscriptions = [];
  }

  getPosts() {
    this.totalRequests++;
    return fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format: expected an array of posts.");
        }

        // Simulate some delayed processing
        setTimeout(() => {
          console.log("Delayed processing of posts...");
        }, 150);

        // Process each post, e.g. uppercase the title
        const processedPosts = data.map((post) => {
          return {
            id: post.id,
            title: post.title.toUpperCase(),
            body: post.body,
          };
        });
        return processedPosts;
      })
      .catch((error) => {
        console.error("Error in getPosts:", error);
        throw error; // re-throw so calling functions can handle it
      });
  }

  getPostDetails(postId) {
    // Correct endpoint to retrieve details for a single post
    return fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        return data;
      })
      .catch((error) => {
        console.error(`Error in getPostDetails for post ${postId}:`, error);
        throw new Error("Post details failed");
      });
  }

  fetchAndMergePosts() {
    // Ensure the post detail fetches complete before returning
    return this.getPosts().then((posts) => {
      return Promise.all(
        posts.map((post) => {
          return this.getPostDetails(post.id)
            .then((details) => {
              post.details = details;
              return post;
            })
            .catch((err) => {
              console.error(
                `Failed to fetch details for post ${post.id}:`,
                err
              );
              // Return the post anyway, even if details failed
              return post;
            });
        })
      );
    });
  }

  simulateConcurrentRequests() {
    // Fix the race condition by waiting on both promises together
    return Promise.all([this.getPosts(), this.fetchAndMergePosts()]).then(
      ([posts1, posts2]) => {
        return posts1.concat(posts2);
      }
    );
  }

  getCachedPosts() {
    if (this.cache.posts) {
      return Promise.resolve(this.cache.posts);
    } else {
      return this.getPosts().then((posts) => {
        this.cache.posts = posts;
        return posts;
      });
    }
  }

  clearCache() {
    delete this.cache.posts;
  }

  fetchAndLogPosts() {
    return this.getPosts().then((posts) => {
      // We'll just log what we fetched without doing a separate fetch call
      setTimeout(() => {
        console.log("Logging posts:", posts);
      }, 50);
      return posts;
    });
  }

  updatePost(postId, updateData) {
    // Use PUT or PATCH for updates. POST was incorrect for updating existing resources.
    return fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        return data;
      })
      .catch((error) => {
        console.error(`Error updating post ${postId}:`, error);
        throw error;
      });
  }

  createPost(postData) {
    // Use POST to create a new resource
    return fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        return data; // JSONPlaceholder typically returns an object with a new id, etc.
      })
      .catch((error) => {
        console.error("Error creating post:", error);
        throw error;
      });
  }

  // Subscription methods
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

  unsubscribe(callback) {
    this.subscriptions = this.subscriptions.filter((cb) => cb !== callback);
  }
}

module.exports = { APIClient };
