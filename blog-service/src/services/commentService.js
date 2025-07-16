const Comment = require('../models/Comment');

exports.addComment = async (blogId, userId, text) => {
  const comment = new Comment({
    blogId,
    userId,
    text,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return await comment.save();
};

exports.getCommentsForBlog = async (blogId) => {
  return await Comment.find({ blogId }).sort({ createdAt: -1 });
};
