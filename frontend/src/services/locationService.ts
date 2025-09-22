import api from '../api';
import { User, Location } from '../types/user';

export interface UpdateLocationResponse {
  message: string;
  user: User;
}

const prefix = '/api/stakeholders-service';

export const locationService = {
  updateLocation: async (location: Location): Promise<UpdateLocationResponse> => {
    const response = await api.put(`${prefix}/location`, location);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get(`${prefix}/profile`);
    return response.data;
  },

  getLocation: async (): Promise<Location> => {
    const response = await api.get(`${prefix}/location`);
    return response.data;
  },
};
