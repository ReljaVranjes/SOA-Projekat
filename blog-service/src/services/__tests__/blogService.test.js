const { createBlog,getBlogById } = require('../blogService');
const Blog = require('../../models/Blog');

// Mock the Blog model
jest.mock('../../models/Blog');

describe('blogService - createBlog', () => {
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
      const result = await getBlogById(mockBlogId);

      // Assert
      expect(Blog.findById).toHaveBeenCalledWith(mockBlogId);
      expect(Blog.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRetrievedBlog);
    });
  });
});
