import api from '../api';

export interface Location {
  lat: number;
  lng: number;
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
  currentLocation?: Location;
}

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
};
