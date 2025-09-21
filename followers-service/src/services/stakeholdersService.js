const axios = require("axios");

class StakeholdersService {
  constructor() {
    this.gatewayUrl =
      process.env.GATEWAY_URL || "http://gateway:8088";
  }

  async getUserById(userId, authToken = null) {
    try {
      console.log(`Fetching user ${userId} from stakeholders service...`);
      console.log(`Auth token present:`, !!authToken);

      const headers = {};
      if (authToken) {
        headers.Authorization = authToken;
        console.log(`Using auth token: ${authToken.substring(0, 20)}...`);
      }

      const response = await axios.get(
        `${this.gatewayUrl}/api/stakeholders-service/users/${userId}`,
        { headers }
      );
      const user = response.data;
      console.log(`Successfully fetched user:`, user);

      return {
        id: user.id,
        username: user.username || user.email,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      console.error(
        `Error fetching user ${userId} from stakeholders service:`,
        error.message
      );
      console.error(`Error details:`, error.response?.data || error);
      // Return minimal user data if stakeholders service is unavailable
      return {
        id: userId,
        username: "Unknown User",
        email: "unknown@example.com",
        role: "Tourist",
      };
    }
  }

  async getUsersByIds(userIds, authToken = null) {
    try {
      const userPromises = userIds.map((id) => this.getUserById(id, authToken));
      const users = await Promise.all(userPromises);
      return users;
    } catch (error) {
      console.error(
        "Error fetching multiple users from stakeholders service:",
        error.message
      );
      return userIds.map((id) => ({
        id,
        username: "Unknown User",
        email: "unknown@example.com",
        role: "Tourist",
      }));
    }
  }

  async getAllUsers() {
    try {
      const response = await axios.get(`${this.gatewayUrl}/api/stakeholders-service/users`);
      return response.data.users.map((user) => ({
        id: user.id,
        username: user.username || user.email,
        email: user.email,
        role: user.role,
      }));
    } catch (error) {
      console.error(
        "Error fetching all users from stakeholders service:",
        error.message
      );
      return [];
    }
  }
}

module.exports = new StakeholdersService();
