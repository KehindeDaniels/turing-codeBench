// APIClient.test.js
const { APIClient } = require("./solution");

describe("APIClient", () => {
  let client;

  // Sample data for mocking API responses.
  const samplePosts = [
    { id: 1, title: "post one", body: "body one" },
    { id: 2, title: "post two", body: "body two" },
  ];

  const samplePostDetails = {
    id: 1,
    title: "post one details",
    body: "detailed body one",
  };

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    client = new APIClient();
    jest.useFakeTimers();
    // Mock global fetch for all tests.
    global.fetch = jest.fn((url, options) => {
      // For fetching list of posts.
      if (
        url === "https://jsonplaceholder.typicode.com/posts" &&
        (!options || options.method === "GET")
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(samplePosts),
          text: () => Promise.resolve(JSON.stringify(samplePosts)),
        });
      }
      // For fetching details of a post.
      if (
        url.match(/https:\/\/jsonplaceholder\.typicode\.com\/posts\/\d+$/) &&
        (!options || options.method === "GET")
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(samplePostDetails),
          text: () => Promise.resolve(JSON.stringify(samplePostDetails)),
        });
      }
      // For updating a post.
      if (
        url.match(/https:\/\/jsonplaceholder\.typicode\.com\/posts\/\d+$/) &&
        options &&
        options.method === "PUT"
      ) {
        const bodyData = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ id: Number(url.split("/").pop()), ...bodyData }),
          text: () =>
            Promise.resolve(
              JSON.stringify({ id: Number(url.split("/").pop()), ...bodyData })
            ),
        });
      }
      // For creating a post.
      if (
        url === "https://jsonplaceholder.typicode.com/posts" &&
        options &&
        options.method === "POST"
      ) {
        const bodyData = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 101, ...bodyData }),
          text: () => Promise.resolve(JSON.stringify({ id: 101, ...bodyData })),
        });
      }

      // Default fallback response.
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(samplePosts),
        text: () => Promise.resolve(JSON.stringify(samplePosts)),
      });
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    global.fetch.mockClear();
  });

  describe("getPosts", () => {
    test("should return processed posts with uppercase titles", async () => {
      const posts = await client.getPosts();
      // Flush any asynchronous setTimeout tasks.
      jest.runAllTimers();
      expect(posts).toBeDefined();
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBe(samplePosts.length);
      posts.forEach((post, index) => {
        expect(post.id).toBe(samplePosts[index].id);
        expect(post.title).toBe(samplePosts[index].title.toUpperCase());
        expect(post.body).toBe(samplePosts[index].body);
      });
    });

    test("should call fetch exactly once when data is valid", async () => {
      await client.getPosts();
      // In a fixed version, duplicate network calls should be eliminated.
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("getPostDetails", () => {
    test("should return parsed post details", async () => {
      const details = await client.getPostDetails(1);
      jest.runAllTimers();
      expect(details).toBeDefined();
      expect(details).toHaveProperty("id", samplePostDetails.id);
      expect(details).toHaveProperty("title", samplePostDetails.title);
      expect(details).toHaveProperty("body", samplePostDetails.body);
    });

    test("should throw error on network failure", async () => {
      // Simulate a network error for details.
      global.fetch.mockImplementationOnce(() =>
        Promise.reject(new Error("Network error"))
      );
      await expect(client.getPostDetails(999)).rejects.toThrow();
    });
  });

  describe("fetchAndMergePosts", () => {
    test("should merge details into each post", async () => {
      // Start the promise
      const postsPromise = client.fetchAndMergePosts();
      // Advance timers so that setTimeouts inside the method resolve.
      jest.advanceTimersByTime(250);
      const posts = await postsPromise;
      posts.forEach((post) => {
        expect(post).toHaveProperty("details");
        expect(post.details).toHaveProperty("id", samplePostDetails.id);
      });
    });
  });

  describe("simulateConcurrentRequests", () => {
    test("should return a merged array without duplicates", async () => {
      const mergedPostsPromise = client.simulateConcurrentRequests();
      // Advance timers to flush any pending timeouts
      jest.advanceTimersByTime(150);
      const mergedPosts = await mergedPostsPromise;
      expect(Array.isArray(mergedPosts)).toBe(true);
      const uniqueIds = new Set(mergedPosts.map((post) => post.id));
      expect(uniqueIds.size).toBe(samplePosts.length);
    });
  });

  describe("Caching", () => {
    test("getCachedPosts should return cached posts on subsequent calls", async () => {
      const posts1 = await client.getCachedPosts();
      // Change fetch to reject to ensure cached version is used.
      global.fetch.mockImplementationOnce(() =>
        Promise.reject(new Error("Should not be called"))
      );
      const posts2 = await client.getCachedPosts();
      expect(posts1).toEqual(posts2);
    });

    test("clearCache should force a refetch of posts", async () => {
      const posts1 = await client.getCachedPosts();
      client.clearCache();
      global.fetch.mockClear();
      const posts2 = await client.getCachedPosts();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(posts2).toEqual(posts1);
    });
  });

  describe("fetchAndLogPosts", () => {
    test("should log posts and avoid duplicate network calls", async () => {
      const posts = await client.fetchAndLogPosts();
      // Advance timers to flush asynchronous logging.
      jest.runAllTimers();
      // In a fixed version, extra duplicate fetches should be removed.
      // We expect a minimal number of fetch calls (ideally one or two total).
      expect(global.fetch.mock.calls.length).toBeLessThanOrEqual(2);
      expect(posts).toBeDefined();
      expect(Array.isArray(posts)).toBe(true);
    });
  });

  describe("updatePost", () => {
    test("should update a post and return updated post data", async () => {
      const updateData = { title: "UPDATED", body: "Updated body" };
      const updatedPost = await client.updatePost(1, updateData);
      expect(updatedPost).toBeDefined();
      expect(updatedPost).toHaveProperty("id", 1);
      expect(updatedPost).toHaveProperty("title", updateData.title);
      expect(updatedPost).toHaveProperty("body", updateData.body);
    });
  });

  describe("createPost", () => {
    test("should create a new post and return the created post with a new id", async () => {
      const postData = { title: "New Post", body: "New body" };
      const newPost = await client.createPost(postData);
      expect(newPost).toBeDefined();
      expect(newPost).toHaveProperty("id");
      expect(newPost.title).toBe(postData.title);
      expect(newPost.body).toBe(postData.body);
    });
  });

  describe("Subscriptions", () => {
    test("subscribe should trigger the callback with an update message", (done) => {
      const callback = jest.fn((message) => {
        try {
          expect(message).toBe("New update available");
          done();
        } catch (err) {
          done(err);
        }
      });
      client.subscribe(callback);
      jest.advanceTimersByTime(150);
    });

    test("unsubscribe should remove the callback from subscriptions", () => {
      const callback = jest.fn();
      client.subscribe(callback);
      client.unsubscribe(callback);
      // Trigger remaining subscriptions manually.
      client.subscriptions.forEach((sub) => sub("Test update"));
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    test("getPosts should throw error if response is not ok", async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
        })
      );
      await expect(client.getPosts()).rejects.toThrow();
    });
  });
});
