import api from '../api';
import { User } from '../types/user';

const prefix = '/api/stakeholders-service';

export const adminService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get(`${prefix}/users`);
    return response.data.users;
  },

  blockUser: async (userId: string): Promise<void> => {
    await api.put(`${prefix}/users/${userId}/block`);
  },

  unblockUser: async (userId: string): Promise<void> => {
    await api.put(`${prefix}/users/${userId}/unblock`);
  },
};
