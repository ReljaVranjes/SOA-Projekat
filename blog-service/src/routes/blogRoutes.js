const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { validateBlog } = require('../middleware/validation.js');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');

router.post('/', authMiddleware, checkRole(['Tourist', 'Guide']), validateBlog, blogController.createBlog);
router.get('/', authMiddleware, checkRole(['Tourist', 'Guide']), blogController.getAllBlogs);
router.get('/:id', authMiddleware, checkRole(['Tourist', 'Guide']), blogController.getBlogById);
router.post('/:id/like', authMiddleware, checkRole(['Tourist', 'Guide']), blogController.likeBlog);

module.exports = router;
