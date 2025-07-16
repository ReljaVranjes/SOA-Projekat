const Blog = require('../models/Blog');

const createBlog = async (data) => {
  const blog = new Blog(data);
  return await blog.save();
};

const getAllBlogs = async () => {
  return await Blog.find().sort({ createdAt: -1 });
};

const getBlogById = async (id) => {
  return await Blog.findById(id);
};

const likeBlog = async (id, userId) => {
  const blog = await Blog.findById(id);
  if (!blog) throw new Error('Blog not found');

  if (blog.likes.includes(userId)) {
    blog.likes = blog.likes.filter((like) => like !== userId);
  } else {
    blog.likes.push(userId);
  } 
  return await blog.save();
};


module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  likeBlog
};
