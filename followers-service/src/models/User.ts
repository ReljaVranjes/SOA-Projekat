export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'tourist';
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface FollowResponse {
  user: User;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
}