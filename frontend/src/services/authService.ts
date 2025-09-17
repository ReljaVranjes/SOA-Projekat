import api from '../api';
import { User } from '../types/user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const prefix = '/api/stakeholders-service';

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  biography: string;
  motto: string;
  profileImage: string;
}

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post(`${prefix}/login`, data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post(`${prefix}/register`, data);
    return response.data;
    },

    verifyToken: async (): Promise<AuthResponse> => {
    // Use profile endpoint to verify token and get user data
    const user = await authService.getProfile();
    // Return a mock AuthResponse since we only have user data
    return {
      token: localStorage.getItem('token') || '',
      user: user
    };
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get(`${prefix}/profile`);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put(`${prefix}/profile`, data);
    return response.data;
  },
};