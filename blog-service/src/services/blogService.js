const Blog = require('../models/Blog');

exports.createBlog = async (data) => {
  const blog = new Blog(data);
  return await blog.save();
};

exports.getAllBlogs = async () => {
  return await Blog.find().sort({ createdAt: -1 });
};

exports.getBlogById = async (id) => {
  return await Blog.findById(id);
};
