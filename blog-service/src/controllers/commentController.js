const commentService = require('../services/commentService');

exports.addComment = async (req, res) => {
  try {
    const { userId, text } = req.body;
    const comment = await commentService.addComment(req.params.blogId, userId, text);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment', details: err.message });
  }
};

exports.getCommentsForBlog = async (req, res) => {
  const comments = await commentService.getCommentsForBlog(req.params.blogId);
  res.json(comments);
};
