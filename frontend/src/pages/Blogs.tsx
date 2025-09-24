import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogService, Blog } from '../services/blogService';
import { authService } from '../services/authService';
import { useApiHandler } from '../utils/handleApi';
import { useAuth } from '../contexts/AuthContext';

interface BlogWithAuthor extends Blog {
  authorName?: string;
  comments?: { user: string; text: string; createdAt: string }[];
}

// Simple markdown to HTML converter
const markdownToHtml = (markdown: string) => {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br>');
};

const Blogs: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [blogs, setBlogs] = useState<BlogWithAuthor[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isReadDialogOpen, setIsReadDialogOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogWithAuthor | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { loading, error, handleApi } = useApiHandler();

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    const result = await handleApi(
      () => blogService.getAllBlogs(),
      {
        errorMessage: 'Failed to load blogs'
      }
    );

    if (result) {
      // Fetch author names for each blog
      const blogsWithAuthors = await Promise.all(
        result.map(async (blog) => {
          try {
            const author = await authService.getUserById(blog.authorId);
            return {
              ...blog,
              authorName: author?.name || 'Unknown Author'
            };
          } catch (error) {
            return {
              ...blog,
              authorName: 'Unknown Author'
            };
          }
        })
      );

      setBlogs(blogsWithAuthors);
    }
    
    // Set initial loading to false after first load
    setIsInitialLoading(false);
  };

  const handleReadBlog = async (blog: BlogWithAuthor) => {
    const comments = await blogService.getComments(blog._id);
    setSelectedBlog({ ...blog, comments });
    setIsReadDialogOpen(true);
  };

  const handleCreateBlog = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    const blogData = {
      title: formData.title,
      description: formData.description,
      authorId: user?.id
    };

    const result = await handleApi(
      () => blogService.createBlog(blogData),
      {
        errorMessage: 'Failed to create blog'
      }
    );

    if (result) {
      setIsCreateDialogOpen(false);
      setFormData({ title: '', description: '' });
      setShowPreview(false);
      loadBlogs(); // Refresh the blogs list
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLikeBlog = async (blogId: string, event?: React.MouseEvent) => {
    // Prevent default behavior and event bubbling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!isAuthenticated) {
      return;
    }

    try {
      const result = await handleApi(
        () => blogService.likeBlog(blogId),
        {
          errorMessage: 'Failed to like blog'
        }
      );

      if (result) {
        // Update the blogs state with the new like data
        setBlogs(prevBlogs => 
          prevBlogs.map(blog => 
            blog._id === blogId 
              ? { ...blog, likes: result.likes }
              : blog
          )
        );

        // Update selected blog if it's currently open
        if (selectedBlog && selectedBlog._id === blogId) {
          setSelectedBlog({ ...selectedBlog, likes: result.likes });
        }
      }
    } catch (error) {
      console.error('Error liking blog:', error);
    }
  };

  // Add comment to a blog
  const handleAddComment = async (blogId: string) => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      await handleApi(
        () => blogService.addComment(blogId, { text: commentText, userId: user?.id || '' }),
        { errorMessage: 'Failed to add comment' }
      );
      // Fetch all comments again after adding
      const comments = await blogService.getComments(blogId);
      setSelectedBlog(prev =>
        prev ? { ...prev, comments } : prev
      );
      setCommentText('');
    } finally {
      setCommentLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateDescription = (description: string, maxLength: number = 150) => {
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + '...';
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Blog</h1>
          <p className="text-gray-600">Read the latest stories and insights from our community</p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Blog
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {blogs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No blogs available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div key={blog._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-600"></div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{blog.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span>By {blog.authorName}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(blog.createdAt)}</span>
                  </div>
                </div>

                <div 
                  className="text-gray-600 mb-4 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: truncateDescription(markdownToHtml(blog.description)) 
                  }}
                />

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={(e) => handleLikeBlog(blog._id, e)}
                    disabled={!isAuthenticated}
                    className={`flex items-center text-sm transition-colors ${
                      isAuthenticated 
                        ? 'text-red-500 hover:text-red-600 cursor-pointer' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <svg 
                      className={`w-4 h-4 mr-1 ${
                        user?.id && blog.likes?.includes(user.id) 
                          ? 'fill-current' 
                          : 'fill-none stroke-current'
                      }`} 
                      viewBox="0 0 20 20"
                      strokeWidth="2"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
                      />
                    </svg>
                    <span>{blog.likes?.length || 0} likes</span>
                  </button>
                  <button 
                    onClick={() => handleReadBlog(blog)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Read Full Blog
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Read Blog Dialog */}
      {isReadDialogOpen && selectedBlog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 pr-4">{selectedBlog.title}</h2>
              <button
                onClick={() => {
                  setIsReadDialogOpen(false);
                  setSelectedBlog(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center text-sm text-gray-500">
                <span>By {selectedBlog.authorName}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(selectedBlog.createdAt)}</span>
              </div>
              <button
                type="button"
                onClick={(e) => handleLikeBlog(selectedBlog._id, e)}
                disabled={!isAuthenticated}
                className={`flex items-center text-sm transition-colors ${
                  isAuthenticated 
                    ? 'text-red-500 hover:text-red-600 cursor-pointer' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg 
                  className={`w-5 h-5 mr-1 ${
                    user?.id && selectedBlog.likes?.includes(user.id) 
                      ? 'fill-current' 
                      : 'fill-none stroke-current'
                  }`} 
                  viewBox="0 0 20 20"
                  strokeWidth="2"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
                  />
                </svg>
                <span>{selectedBlog.likes?.length || 0} likes</span>
              </button>
            </div>

            <div className="prose max-w-none">
              <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg mb-6"></div>
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(selectedBlog.description) }}
              />
            </div>

            {/* Comments Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Comments</h3>
              <div className="space-y-4 mb-4">
                {selectedBlog.comments && selectedBlog.comments.length > 0 ? (
                  selectedBlog.comments.map((comment, idx) => (
                    <div key={idx} className="bg-gray-100 rounded p-3">
                      <div className="text-sm text-gray-700">{comment.text}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        By {comment.user} • {formatDate(comment.createdAt)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">No comments yet.</div>
                )}
              </div>
              {isAuthenticated && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleAddComment(selectedBlog._id);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none"
                    placeholder="Add a comment..."
                    disabled={commentLoading}
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || commentLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {commentLoading ? 'Posting...' : 'Post'}
                  </button>
                </form>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setIsReadDialogOpen(false);
                  setSelectedBlog(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Blog Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Blog</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter blog title..."
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className={`px-3 py-1 text-xs rounded ${
                        !showPreview 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPreview(true)}
                      className={`px-3 py-1 text-xs rounded ${
                        showPreview 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                
                <div className="border border-gray-300 rounded-md min-h-[200px]">
                  {!showPreview ? (
                    <>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={10}
                        className="w-full px-3 py-2 border-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Write your blog content... (Markdown supported: # ## ### **bold** *italic* - list)"
                      />
                      <div className="px-3 py-2 text-xs text-gray-500 border-t bg-gray-50">
                        <strong>Markdown supported:</strong> # Heading, ## Subheading, **bold**, *italic*, - bullet points
                      </div>
                    </>
                  ) : (
                    <div className="p-3 min-h-[200px]">
                      <div 
                        className="prose max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ 
                          __html: formData.description 
                            ? markdownToHtml(formData.description) 
                            : '<span class="text-gray-400">Preview will appear here...</span>'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormData({ title: '', description: '' });
                  setShowPreview(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBlog}
                disabled={!formData.title.trim() || !formData.description.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Create Blog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blogs;