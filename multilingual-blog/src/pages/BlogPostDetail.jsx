import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import blogsData from "../data/blogs.json";
import { useTranslation } from "react-i18next";

function BlogPostDetail() {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const blog = blogsData.find((blog) => blog.id === parseInt(id));
    setPost(blog);
  }, [id]);

  if (!post) return <p>tblog_not_found"</p>;

  const blogDetails = post.details[i18n.language]; // Use the current language's details

  return (
    <div>
      <h1>{post.title}</h1>
      <p>author: {post.author}</p>
      <p>category: {post.category}</p>
      <p>created_in: {post.createdOn}</p>
      <p>{blogDetails}</p>
    </div>
  );
}

export default BlogPostDetail;
