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
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!data || !Array.isArray(data)) {
          throw new Error("Invalid data format received");
        }

        return data.map((post) => ({
          id: post.id,
          title: post.title.toUpperCase(),
          body: post.body,
        }));
      })
      .catch((error) => {
        console.error("Error in getPosts:", error);
        throw error;
      });
  }

  getPostDetails(postId) {
    return fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        console.error(`Error in getPostDetails for post ${postId}:`, error);
        // instead of returning an empty array, throw the error
        throw error;
      });
  }

  async fetchAndMergePosts() {
    try {
      const posts = await this.getPosts();
      const mergedPosts = await Promise.all(
        posts.map(async (post) => {
          try {
            const details = await this.getPostDetails(post.id);
            return { ...post, details };
          } catch (error) {
            console.error(
              `Failed to fetch details for post ${post.id}:`,
              error
            );
            return post;
          }
        })
      );
      return mergedPosts;
    } catch (error) {
      console.error("Error in fetchAndMergePosts:", error);
      throw error;
    }
  }

  async simulateConcurrentRequests() {
    try {
      const [posts1, posts2] = await Promise.all([
        this.getPosts(),
        this.fetchAndMergePosts(),
      ]);
      return [...posts1, ...posts2];
    } catch (error) {
      console.error("Error in simulateConcurrentRequests:", error);
      throw error;
    }
  }

  getCachedPosts() {
    if (this.cache.posts) {
      return Promise.resolve(this.cache.posts);
    }
    return this.getPosts().then((posts) => {
      this.cache.posts = posts;
      return posts;
    });
  }

  clearCache() {
    this.cache = {};
  }

  async fetchAndLogPosts() {
    try {
      const posts = await this.getPosts();
      console.log("Logging posts:", posts);
      return posts;
    } catch (error) {
      console.error("Error in fetchAndLogPosts:", error);
      throw error;
    }
  }

  updatePost(postId, updateData) {
    return fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (this.cache.posts) {
          this.cache.posts = this.cache.posts.map((post) =>
            post.id === postId ? { ...post, ...data } : post
          );
        }
        return data;
      })
      .catch((error) => {
        console.error(`Error updating post ${postId}:`, error);
        throw error;
      });
  }

  createPost(postData) {
    return fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (this.cache.posts) {
          this.cache.posts = [...this.cache.posts, data];
        }
        return data;
      })
      .catch((error) => {
        console.error("Error creating post:", error);
        throw error;
      });
  }

  subscribe(callback) {
    if (typeof callback !== "function") {
      throw new Error("Callback must be a function");
    }
    this.subscriptions.push(callback);
    // Schedule the callback asynchronously and store its timeout ID on the callback.
    const timeoutId = setTimeout(() => {
      // Only call the callback if it’s still subscribed.
      if (this.subscriptions.includes(callback)) {
        callback("New update available");
      }
    }, 100);
    // Attach the timeoutId to the callback for later cancellation.
    callback._timeoutId = timeoutId;
  }

  unsubscribe(callback) {
    // Remove the callback from subscriptions.
    this.subscriptions = this.subscriptions.filter((cb) => cb !== callback);
    // Clear the scheduled timeout if it exists.
    if (callback._timeoutId) {
      clearTimeout(callback._timeoutId);
    }
  }

  unsubscribe(callback) {
    this.subscriptions = this.subscriptions.filter((cb) => cb !== callback);
  }
}

module.exports = { APIClient };
