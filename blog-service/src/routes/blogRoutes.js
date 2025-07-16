const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { validateBlog } = require('../middleware/validation.js');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');

router.post('/', authMiddleware, checkRole(['turista', 'vodic']), validateBlog, blogController.createBlog);
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogById);
router.post('/:id/like', authMiddleware, checkRole(['turista', 'vodic']), blogController.likeBlog);

module.exports = router;
