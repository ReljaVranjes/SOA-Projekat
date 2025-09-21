const followersService = require("../services/followersService");
const recommendationService = require("../services/recommendationService");
const stakeholdersService = require("../services/stakeholdersService");

class FollowersController {
  async followUser(req, res) {
    try {
      const followerId = req.user.id;
      const { followeeId } = req.params;

      const result = await followersService.followUser(followerId, followeeId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in followUser:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async unfollowUser(req, res) {
    try {
      const followerId = req.user.id;
      const { followeeId } = req.params;

      const result = await followersService.unfollowUser(
        followerId,
        followeeId
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in unfollowUser:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getFollowers(req, res) {
    try {
      const { userId } = req.params;
      const followers = await followersService.getFollowers(userId);
      res.status(200).json({ followers });
    } catch (error) {
      console.error("Error in getFollowers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getFollowing(req, res) {
    try {
      const { userId } = req.params;
      const following = await followersService.getFollowing(userId);
      res.status(200).json({ following });
    } catch (error) {
      console.error("Error in getFollowing:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getMyFollowers(req, res) {
    try {
      const userId = req.user.id;
      const authToken = req.headers.authorization;
      const followerIds = await followersService.getFollowers(userId);
      const followers = await stakeholdersService.getUsersByIds(followerIds, authToken);
      res.status(200).json({ followers });
    } catch (error) {
      console.error("Error in getMyFollowers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getMyFollowing(req, res) {
    try {
      const userId = req.user.id;
      const authToken = req.headers.authorization;
      const followingIds = await followersService.getFollowing(userId);
      const following = await stakeholdersService.getUsersByIds(followingIds, authToken);
      res.status(200).json({ following });
    } catch (error) {
      console.error("Error in getMyFollowing:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async checkFollowStatus(req, res) {
    try {
      const followerId = req.user.id;
      const { userId } = req.params;

      const isFollowing = await followersService.isFollowing(
        followerId,
        userId
      );
      res.status(200).json({ isFollowing });
    } catch (error) {
      console.error("Error in checkFollowStatus:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit, 10) || 10;
      const authToken = req.headers.authorization;
      console.log('Limit value:', limit, 'Type:', typeof limit);

      const recommendationsData =
        await recommendationService.getFollowRecommendations(userId, limit);
      
      // Get user details from stakeholders service
      const recommendations = await Promise.all(
        recommendationsData.map(async (recData) => {
          const userDetails = await stakeholdersService.getUserById(recData.id, authToken);
          return {
            ...userDetails,
            mutualConnections: recData.mutualConnections,
            reason: recData.reason,
          };
        })
      );
      
      res.status(200).json({ recommendations });
    } catch (error) {
      console.error("Error in getRecommendations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getMutualFollows(req, res) {
    try {
      const userId = req.user.id;
      const { targetUserId } = req.params;

      const mutualFollows = await recommendationService.getMutualFollows(
        userId,
        targetUserId
      );
      res.status(200).json({ mutualFollows });
    } catch (error) {
      console.error("Error in getMutualFollows:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getPopularUsers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const authToken = req.headers.authorization;
      const popularUsersData = await recommendationService.getPopularUsers(limit);
      
      // Get user details from stakeholders service
      const popularUsers = await Promise.all(
        popularUsersData.map(async (userData) => {
          const userDetails = await stakeholdersService.getUserById(userData.id, authToken);
          return {
            ...userDetails,
            followerCount: userData.followerCount,
          };
        })
      );
      
      res.status(200).json({ popularUsers });
    } catch (error) {
      console.error("Error in getPopularUsers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getFollowedUserIds(req, res) {
    try {
      const userId = req.user.id;
      const followedIds = await followersService.getFollowedUserIds(userId);
      res.status(200).json({ followedIds });
    } catch (error) {
      console.error("Error in getFollowedUserIds:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getAllUsers(req, res) {
    try {
      const currentUserId = req.user.id;
      const allUsers = await stakeholdersService.getAllUsers();
      // Filter out the current user
      const users = allUsers.filter(user => user.id !== currentUserId);
      res.status(200).json({ users });
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = new FollowersController();
