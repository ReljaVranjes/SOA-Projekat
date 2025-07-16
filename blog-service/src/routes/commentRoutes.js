const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { validateComment } = require('../middleware/validation.js')

router.post('/:blogId', validateComment, commentController.addComment);
router.get('/:blogId', commentController.getCommentsForBlog);

module.exports = router;
