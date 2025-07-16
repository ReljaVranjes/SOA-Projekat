const { body, validationResult } = require('express-validator');

exports.validateBlog = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('authorId').notEmpty().withMessage('Author ID is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

exports.validateComment = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('text').notEmpty().withMessage('Comment text is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
