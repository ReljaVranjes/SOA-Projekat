const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { validateComment } = require('../middleware/validation.js');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');

router.post('/:blogId', authMiddleware, checkRole(['turista', 'vodic']), validateComment, commentController.addComment);
router.get('/:blogId', commentController.getCommentsForBlog);

module.exports = router;
