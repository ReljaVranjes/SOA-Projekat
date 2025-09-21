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
  name?: string;
  balance?: number;
}
