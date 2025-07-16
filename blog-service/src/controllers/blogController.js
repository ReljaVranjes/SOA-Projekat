const blogService = require('../services/blogService');

const createBlog = async (req, res) => {
  try {
    const blog = await blogService.createBlog(req.body);
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create blog', details: err.message });
  }
};

const getAllBlogs = async (req, res) => {
  const blogs = await blogService.getAllBlogs();
  res.json(blogs);
};

const getBlogById = async (req, res) => {
  const blog = await blogService.getBlogById(req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });
  res.json(blog);
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
}

