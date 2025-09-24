const Blog = require('../models/Blog');
const followersClient = require('./followersClient');

const createBlog = async (data) => {
  const blog = new Blog(data);
  return await blog.save();
};

const getAllBlogs = async (userId = null, authToken = null) => {
  console.log('getAllBlogs called with:', { userId, hasAuthToken: !!authToken });
  
  if (!userId) {
    // If no user ID, return empty array (no blogs visible)
    console.log('No user ID provided, returning empty blog list');
    return [];
  }

  try {
    let allowedAuthorIds = [userId]; // Always include user's own blogs
    
    if (authToken) {
      // Try to get list of users that the current user is following
      const followedUserIds = await followersClient.getFollowedUserIds(userId, authToken);
      console.log(`User ${userId} is following users:`, followedUserIds);
      
      // Add followed users to allowed authors
      allowedAuthorIds = [...followedUserIds, userId];
    } else {
      console.log('No auth token provided, showing only user\'s own blogs');
    }
    
    console.log(`Filtering blogs for authors:`, allowedAuthorIds);
    
    // Filter blogs to only show those from followed users (and own blogs)
    const blogs = await Blog.find({ 
      authorId: { $in: allowedAuthorIds } 
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${blogs.length} blogs from allowed authors`);
    return blogs;
  } catch (error) {
    console.error('Error filtering blogs by followed users:', error);
    // If followers service is unavailable, at least show user's own blogs
    console.log('Falling back to showing only user\'s own blogs');
    const blogs = await Blog.find({ authorId: userId }).sort({ createdAt: -1 });
    console.log(`Found ${blogs.length} of user's own blogs`);
    return blogs;
  }
};

const getBlogById = async (id, userId = null, authToken = null) => {
  const blog = await Blog.findById(id);
  if (!blog) {
    return null;
  }

  if (!userId || !authToken) {
    // If no user authentication, deny access
    console.log('No authentication provided, denying blog access');
    return null;
  }

  // Allow access to own blogs
  if (blog.authorId === userId) {
    console.log(`User ${userId} accessing their own blog`);
    return blog;
  }

  try {
    // Check if user is following the blog author
    const isFollowing = await followersClient.isFollowing(userId, blog.authorId, authToken);
    console.log(`User ${userId} following status for blog author ${blog.authorId}:`, isFollowing);
    
    if (isFollowing) {
      return blog;
    } else {
      console.log(`User ${userId} is not following blog author ${blog.authorId}, access denied`);
      return null;
    }
  } catch (error) {
    console.error('Error checking follow status for blog access:', error);
    // If followers service is unavailable, deny access for safety
    return null;
  }
};

const likeBlog = async (id, userId) => {
  const blog = await Blog.findById(id);
  if (!blog) throw new Error('Blog not found');

  if (blog.likes.includes(userId)) {
    blog.likes = blog.likes.filter((like) => like !== userId);
  } else {
    blog.likes.push(userId);
  } 
  return await blog.save();
};


module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  likeBlog
};
