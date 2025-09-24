const { createBlog, getBlogById, getAllBlogs, likeBlog } = require('../blogService');
const { addComment, getCommentsForBlog } = require('../commentService');
const Blog = require('../../models/Blog');
const Comment = require('../../models/Comment');

// Mock the Blog and Comment models
jest.mock('../../models/Blog');
jest.mock('../../models/Comment');

describe('blogService and commentService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createBlog', () => {
    it('should create a blog successfully with valid data', async () => {
      // Arrange
      const mockBlogData = {
        authorId: 'user123',
        title: 'Test Blog Title',
        description: 'This is a test blog description'
      };

      const mockSavedBlog = {
        _id: 'blog123',
        ...mockBlogData,
        createdAt: new Date(),
        likes: []
      };

      // Mock the Blog constructor and save method
      const mockBlogInstance = {
        save: jest.fn().mockResolvedValue(mockSavedBlog)
      };
      Blog.mockImplementation(() => mockBlogInstance);

      // Act
      const result = await createBlog(mockBlogData);

      // Assert
      expect(Blog).toHaveBeenCalledWith(mockBlogData);
      expect(mockBlogInstance.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSavedBlog);
    });
  });
  describe('getBlogById', () => {
    it('should retrieve a blog info by ID', async () => {
      // Arrange
      const mockBlogId = 'blog123';
      const mockUserId = 'user123';
      const mockAuthToken = 'mock-auth-token';

      const mockRetrievedBlog = {
        _id: 'blog123',
        authorId: 'user123',
        title: 'Test Blog Title',
        description: 'This is a test blog description',
        createdAt: new Date(),
        likes: []
      };

      Blog.findById = jest.fn().mockResolvedValue(mockRetrievedBlog);

      // Act
      const result = await getBlogById(mockBlogId, mockUserId, mockAuthToken);

      // Assert
      expect(Blog.findById).toHaveBeenCalledWith(mockBlogId);
      expect(Blog.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRetrievedBlog);
    });
  });

  describe('likeBlog', () => {
    it('should add like when user has not liked the blog yet', async () => {
      // Arrange
      const blogId = 'blog123';
      const userId = 'user456';
      
      const mockBlog = {
        _id: blogId,
        authorId: 'author123',
        title: 'Test Blog',
        description: 'Test description',
        likes: [],
        save: jest.fn().mockResolvedValue({
          _id: blogId,
          authorId: 'author123',
          title: 'Test Blog',
          description: 'Test description',
          likes: [userId]
        })
      };

      Blog.findById = jest.fn().mockResolvedValue(mockBlog);

      // Act
      const result = await likeBlog(blogId, userId);

      // Assert
      expect(Blog.findById).toHaveBeenCalledWith(blogId);
      expect(mockBlog.likes).toContain(userId);
      expect(mockBlog.save).toHaveBeenCalledTimes(1);
      expect(result.likes).toContain(userId);
    });

    it('should throw error when blog is not found', async () => {
      // Arrange
      const blogId = 'nonexistent123';
      const userId = 'user456';

      Blog.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(likeBlog(blogId, userId)).rejects.toThrow('Blog not found');
      expect(Blog.findById).toHaveBeenCalledWith(blogId);
    });
  });

  describe('addComment', () => {
    it('should create a comment successfully with valid data', async () => {
      // Arrange
      const blogId = 'blog123';
      const userId = 'user456';
      const text = 'This is a test comment';

      const mockSavedComment = {
        _id: 'comment123',
        blogId,
        userId,
        text,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockCommentInstance = {
        save: jest.fn().mockResolvedValue(mockSavedComment)
      };
      Comment.mockImplementation(() => mockCommentInstance);

      // Act
      const result = await addComment(blogId, userId, text);

      // Assert
      expect(Comment).toHaveBeenCalledWith({
        blogId,
        userId,
        text,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
      expect(mockCommentInstance.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSavedComment);
    });
  });
});
