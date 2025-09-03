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

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
  id: string;
}

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/register', data);
    return response.data;
  },

  verifyToken: async (): Promise<AuthResponse> => {
    const response = await api.get('/verify');
    return response.data;
  },
};