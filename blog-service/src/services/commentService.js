const Comment = require('../models/Comment');

const addComment = async (blogId, userId, text) => {
  const comment = new Comment({
    blogId,
    userId,
    text,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return await comment.save();
};

const getCommentsForBlog = async (blogId) => {
  return await Comment.find({ blogId }).sort({ createdAt: -1 });
};

module.exports = {
  addComment,
  getCommentsForBlog
};
