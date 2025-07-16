const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  authorId: String,
  title: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  likes: [String]
});

module.exports = mongoose.model('Blog', blogSchema);
