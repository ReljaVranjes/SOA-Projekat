const blogService = require('../services/blogService');

const createBlog = async (req, res) => {
  try {
    const authorId = req.user.id; 
    const blogData = {
      ...req.body,
      authorId, 
    };
    const blog = await blogService.createBlog(blogData);
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create blog', details: err.message });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const userId = req.user?.id;
    const authToken = req.headers.authorization;
    const blogs = await blogService.getAllBlogs(userId, authToken);
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blogs', details: err.message });
  }
};

const getBlogById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const authToken = req.headers.authorization;
    const blog = await blogService.getBlogById(req.params.id, userId, authToken);
    if (!blog) return res.status(404).json({ error: 'Blog not found or access denied' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blog', details: err.message });
  }
};

const likeBlog = async (req, res) => {
  try { 
    const blog = await blogService.likeBlog(req.params.id, req.user.id);
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to like blog', details: err.message });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  likeBlog
}

