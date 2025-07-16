const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { validateBlog } = require('../middleware/validation.js')

router.post('/', validateBlog, blogController.createBlog);
router.get('/', validateBlog, blogController.getAllBlogs);
router.get('/:id', validateBlog, blogController.getBlogById);

module.exports = router;
