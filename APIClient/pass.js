// APIClient.js

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
        // Process posts: convert title to uppercase.
        const processedPosts = data.map((post) => ({
          id: post.id,
          title: post.title.toUpperCase(),
          body: post.body,
        }));
        return processedPosts;
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
        // Throw a new error with the expected message.
        throw new Error("Post details failed");
      });
  }

  async fetchAndMergePosts() {
    try {
      const posts = await this.getPosts();
      const detailPromises = posts.map(async (post) => {
        try {
          // Use Promise.race to avoid hanging detail fetches.
          const details = await Promise.race([
            this.getPostDetails(post.id),
            new Promise((resolve) => setTimeout(() => resolve(null), 1000)),
          ]);
          if (details === null) {
            return post;
          }
          return { ...post, details };
        } catch (error) {
          console.error(`Failed to fetch details for post ${post.id}:`, error);
          return post;
        }
      });
      return Promise.all(detailPromises);
    } catch (error) {
      console.error("Error in fetchAndMergePosts:", error);
      throw error;
    }
  }

  async simulateConcurrentRequests() {
    try {
      // Run getPosts and fetchAndMergePosts concurrently.
      const [posts1, posts2] = await Promise.all([
        this.getPosts(),
        this.fetchAndMergePosts(),
      ]);
      const mergedPosts = [...posts1, ...posts2];
      // Remove duplicates based on post id.
      const uniquePosts = Array.from(
        new Map(mergedPosts.map((post) => [post.id, post])).values()
      );
      return uniquePosts;
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
        // If the response is an array, return the object matching postId.
        if (Array.isArray(data)) {
          const updated = data.find((post) => post.id === postId);
          return updated || data[0];
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
    setTimeout(() => {
      try {
        callback("New update available");
      } catch (error) {
        console.error("Subscription callback error:", error);
      }
    }, 100);
  }

  unsubscribe(callback) {
    this.subscriptions = this.subscriptions.filter((cb) => cb !== callback);
  }
}

module.exports = { APIClient };
