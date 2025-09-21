import api from "../api";

export interface User {
  id: string;
  username: string;
  role: string;
}

export interface FollowResponse {
  success: boolean;
  message: string;
}

export interface RecommendationUser extends User {
  mutualConnections: number;
  reason: string;
}

export interface PopularUser extends User {
  followerCount: number;
}

const prefix = "/api/followers-service";

class FollowersService {
  async followUser(followeeId: string): Promise<FollowResponse> {
    const response = await api.post(`${prefix}/follow/${followeeId}`);
    return response.data;
  }

  async unfollowUser(followeeId: string): Promise<FollowResponse> {
    const response = await api.delete(`${prefix}/unfollow/${followeeId}`);
    return response.data;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const response = await api.get(`${prefix}/followers/${userId}`);
    return response.data.followers;
  }

  async getFollowing(userId: string): Promise<User[]> {
    const response = await api.get(`${prefix}/following/${userId}`);
    return response.data.following;
  }

  async getMyFollowers(): Promise<User[]> {
    const response = await api.get(`${prefix}/my-followers`);
    return response.data.followers;
  }

  async getMyFollowing(): Promise<User[]> {
    const response = await api.get(`${prefix}/my-following`);

    console.log(response.data.following);

    return response.data.following;
  }

  async checkFollowStatus(userId: string): Promise<boolean> {
    const response = await api.get(`${prefix}/is-following/${userId}`);
    return response.data.isFollowing;
  }

  async getRecommendations(limit: number = 10): Promise<RecommendationUser[]> {
    const response = await api.get(`${prefix}/recommendations?limit=${limit}`);
    return response.data.recommendations;
  }

  async getMutualFollows(targetUserId: string): Promise<User[]> {
    const response = await api.get(`${prefix}/mutual/${targetUserId}`);
    return response.data.mutualFollows;
  }

  async getPopularUsers(limit: number = 10): Promise<PopularUser[]> {
    const response = await api.get(`${prefix}/popular?limit=${limit}`);
    return response.data.popularUsers;
  }

  async getFollowedUserIds(): Promise<string[]> {
    const response = await api.get(`${prefix}/followed-ids`);
    return response.data.followedIds;
  }

  async getAllUsers(): Promise<User[]> {
    const response = await api.get(`/api/stakeholders-service/users`);
    return response.data.users.map((user: any) => ({
      id: user.id,
      username: user.username || user.email,
      role: user.role,
    }));
  }
}

export default new FollowersService();
