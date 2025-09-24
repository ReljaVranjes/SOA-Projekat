const axios = require('axios');

class FollowersClient {
  constructor() {
    this.followersUrl = process.env.FOLLOWERS_SERVICE_URL || 'http://followers-service:7000';
  }

  async getFollowedUserIds(userId, authToken) {
    try {
      console.log(`Fetching followed user IDs for user ${userId} from followers service...`);
      
      const headers = {};
      if (authToken) {
        headers.Authorization = authToken;
      }
      
      const response = await axios.get(`${this.followersUrl}/followed-ids`, { headers });
      console.log(`Successfully fetched followed user IDs:`, response.data.followedIds);
      
      return response.data.followedIds || [];
    } catch (error) {
      console.error(`Error fetching followed user IDs:`, error.message);
      console.error(`Error details:`, error.response?.data || error);
      // Return empty array if followers service is unavailable
      return [];
    }
  }

  async isFollowing(followerId, followeeId, authToken) {
    try {
      console.log(`Checking if user ${followerId} is following ${followeeId}...`);
      
      const headers = {};
      if (authToken) {
        headers.Authorization = authToken;
      }
      
      const response = await axios.get(`${this.followersUrl}/is-following/${followeeId}`, { headers });
      console.log(`Following status:`, response.data.isFollowing);
      
      return response.data.isFollowing || false;
    } catch (error) {
      console.error(`Error checking follow status:`, error.message);
      console.error(`Error details:`, error.response?.data || error);
      // Return false if followers service is unavailable
      return false;
    }
  }
}

module.exports = new FollowersClient();