const neo4jConnection = require("../config/neo4j");

class FollowersService {
  getDriver() {
    return neo4jConnection.getDriver();
  }

  async ensureUserNode(userId) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(
        `
                MERGE (u:User {id: $userId})
                ON CREATE SET u.createdAt = datetime()
                RETURN u
            `,
        { userId }
      );

      return result.records[0]?.get("u").properties;
    } catch (error) {
      console.error("Error ensuring user node:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async followUser(followerId, followeeId) {
    const session = this.getDriver().session();
    try {
      const existingFollow = await session.run(
        `
                MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followee:User {id: $followeeId})
                RETURN r
            `,
        { followerId, followeeId }
      );

      if (existingFollow.records.length > 0) {
        return { success: false, message: "Already following this user" };
      }

      if (followerId === followeeId) {
        return { success: false, message: "Cannot follow yourself" };
      }

      await session.run(
        `
                MERGE (follower:User {id: $followerId})
                MERGE (followee:User {id: $followeeId})
                CREATE (follower)-[r:FOLLOWS {createdAt: datetime()}]->(followee)
                RETURN r
            `,
        { followerId, followeeId }
      );

      return { success: true, message: "Successfully followed user" };
    } catch (error) {
      console.error("Error following user:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async unfollowUser(followerId, followeeId) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(
        `
                MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followee:User {id: $followeeId})
                DELETE r
                RETURN COUNT(r) as deletedCount
            `,
        { followerId, followeeId }
      );

      const deletedCount =
        result.records[0]?.get("deletedCount").toNumber() || 0;

      if (deletedCount === 0) {
        return { success: false, message: "Not following this user" };
      }

      return { success: true, message: "Successfully unfollowed user" };
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getFollowers(userId) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(
        `
                MATCH (follower:User)-[:FOLLOWS]->(user:User {id: $userId})
                RETURN follower.id as id
                ORDER BY follower.id
            `,
        { userId }
      );

      return result.records.map((record) => record.get("id"));
    } catch (error) {
      console.error("Error getting followers:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getFollowing(userId) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(
        `
                MATCH (user:User {id: $userId})-[:FOLLOWS]->(following:User)
                RETURN following.id as id
                ORDER BY following.id
            `,
        { userId }
      );

      return result.records.map((record) => record.get("id"));
    } catch (error) {
      console.error("Error getting following:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async isFollowing(followerId, followeeId) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(
        `
                MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followee:User {id: $followeeId})
                RETURN COUNT(r) > 0 as isFollowing
            `,
        { followerId, followeeId }
      );

      return result.records[0]?.get("isFollowing") || false;
    } catch (error) {
      console.error("Error checking follow status:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getFollowedUserIds(userId) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(
        `
                MATCH (user:User {id: $userId})-[:FOLLOWS]->(following:User)
                RETURN COLLECT(following.id) as followedIds
            `,
        { userId }
      );

      return result.records[0]?.get("followedIds") || [];
    } catch (error) {
      console.error("Error getting followed user IDs:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getAllUserIds(currentUserId) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(
        `
                MATCH (user:User)
                WHERE user.id <> $currentUserId
                RETURN user.id as id
                ORDER BY user.id
            `,
        { currentUserId }
      );

      return result.records.map((record) => record.get("id"));
    } catch (error) {
      console.error("Error getting all user IDs:", error);
      throw error;
    } finally {
      await session.close();
    }
  }
}

module.exports = new FollowersService();
