const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { validateComment } = require('../middleware/validation.js')

router.post('/:blogId/comments', validateComment, commentController.addComment);
router.get('/:blogId/comments', validateComment, commentController.getCommentsForBlog);

module.exports = router;
