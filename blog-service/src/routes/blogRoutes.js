const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { validateBlog } = require('../middleware/validation.js')

router.post('/', validateBlog, blogController.createBlog);
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogById);
router.post('/:id/like', blogController.likeBlog);

module.exports = router;
