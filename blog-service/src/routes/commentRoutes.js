const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { validateComment } = require('../middleware/validation.js');
const headerAuthMiddleware = require('../middleware/headerAuthMiddleware');
const checkRole = require('../middleware/checkRole');

router.post('/:blogId', headerAuthMiddleware, checkRole(['Tourist', 'Guide']), validateComment, commentController.addComment);
router.get('/:blogId', commentController.getCommentsForBlog);

module.exports = router;
