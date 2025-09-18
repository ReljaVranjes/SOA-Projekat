const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { validateBlog } = require('../middleware/validation.js');
const headerAuthMiddleware = require('../middleware/headerAuthMiddleware');
const checkRole = require('../middleware/checkRole');

router.post('/', headerAuthMiddleware, checkRole(['Tourist', 'Guide']), validateBlog, blogController.createBlog);
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogById);
router.post('/:id/like', headerAuthMiddleware, checkRole(['Tourist', 'Guide']), blogController.likeBlog);

module.exports = router;
