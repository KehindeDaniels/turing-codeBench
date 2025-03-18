// src\pages\BlogPostDetail.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import blogsData from "../data/blogs.json";
import { useTranslation } from "react-i18next";

function HomePage() {
  const { t } = useTranslation();
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    setBlogs(blogsData);
  }, []);

  return (
    <div>
      <section>
        <h1>hero</h1>
        <p>intro</p>
      </section>

      <section>
        <h2>recent_posts</h2>
        {blogs.length === 0 ? (
          <p>no_blogs_available</p>
        ) : (
          <ul>
            {blogs.map((blog) => (
              <li key={blog.id}>
                <h3>{blog.title}</h3>
                <p>author: {blog.author}</p>
                <p>created_in: {blog.createdOn}</p>
                <Link to={`/post/${blog.id}`}>read_more</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default HomePage;
