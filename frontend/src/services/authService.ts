import api from '../api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: string;
}


export interface User {
  id: string;
  email: string;
  role: string;
  username: string;
  firstName: string;
  lastName: string;
  biography: string;
  motto: string;
  profileImage: string;
  status: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const prefix = '/api/stakeholders-service';

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
    const response = await api.get(`${prefix}/verify`);
    return response.data;
  },
};