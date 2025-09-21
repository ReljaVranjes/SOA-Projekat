import api from '../api';

export interface Blog {
  _id: string;
  authorId: string;
  title: string;
  description: string;
  createdAt: string;
  likes: string[];
}

const prefix = '/api/blog-service';

export const blogService = {
  // Create new blog
  createBlog: async (blogData: Partial<Blog>): Promise<Blog> => {
    const response = await api.post(`${prefix}/blogs/`, blogData);
    return response.data;
  },

  // Get all blogs
  getAllBlogs: async (): Promise<Blog[]> => {
    const response = await api.get(`${prefix}/blogs/`);
    return response.data;
  },

  // Get blog by ID
  getBlogById: async (blogId: string): Promise<Blog> => {
    const response = await api.get(`${prefix}/blogs/${blogId}`);
    return response.data;
  },

  // Like blog
  likeBlog: async (blogId: string): Promise<Blog> => {
    const response = await api.post(`${prefix}/blogs/${blogId}/like`);
    return response.data;
  },
};