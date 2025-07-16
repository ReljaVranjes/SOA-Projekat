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

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
};
