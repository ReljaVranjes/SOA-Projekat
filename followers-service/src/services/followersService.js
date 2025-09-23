const neo4jConnection = require("../config/neo4j");
const { trace } = require('@opentelemetry/api');

const tracer = trace.getTracer('followers-service');

class FollowersService {
  getDriver() {
    return neo4jConnection.getDriver();
  }

  async ensureUserNode(userId) {
    return tracer.startActiveSpan('ensureUserNode', async (span) => {
      const session = this.getDriver().session();
      span.setAttributes({
        'followers.userId': userId,
        'operation': 'ensure_user_node'
      });

      try {
        const result = await session.run(
          `
                  MERGE (u:User {id: $userId})
                  ON CREATE SET u.createdAt = datetime()
                  RETURN u
              `,
          { userId }
        );

        const userProperties = result.records[0]?.get("u").properties;
        span.setStatus({ code: 1 });
        return userProperties;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
        console.error("Error ensuring user node:", error);
        throw error;
      } finally {
        await session.close();
        span.end();
      }
    });
  }

  async followUser(followerId, followeeId) {
    return tracer.startActiveSpan('followUser', async (span) => {
      const session = this.getDriver().session();
      span.setAttributes({
        'followers.followerId': followerId,
        'followers.followeeId': followeeId,
        'operation': 'follow_user'
      });

      try {
        const existingFollow = await session.run(
          `
                  MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followee:User {id: $followeeId})
                  RETURN r
              `,
          { followerId, followeeId }
        );

        if (existingFollow.records.length > 0) {
          span.setStatus({ code: 2, message: "Already following this user" });
          return { success: false, message: "Already following this user" };
        }

        if (followerId === followeeId) {
          span.setStatus({ code: 2, message: "Cannot follow yourself" });
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

        span.setStatus({ code: 1 });
        return { success: true, message: "Successfully followed user" };
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
        console.error("Error following user:", error);
        throw error;
      } finally {
        await session.close();
        span.end();
      }
    });
  }

  async unfollowUser(followerId, followeeId) {
    return tracer.startActiveSpan('unfollowUser', async (span) => {
      const session = this.getDriver().session();
      span.setAttributes({
        'followers.followerId': followerId,
        'followers.followeeId': followeeId,
        'operation': 'unfollow_user'
      });

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
          span.setStatus({ code: 2, message: "Not following this user" });
          return { success: false, message: "Not following this user" };
        }

        span.setStatus({ code: 1 });
        return { success: true, message: "Successfully unfollowed user" };
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
        console.error("Error unfollowing user:", error);
        throw error;
      } finally {
        await session.close();
        span.end();
      }
    });
  }

  async getFollowers(userId) {
    return tracer.startActiveSpan('getFollowers', async (span) => {
      const session = this.getDriver().session();
      span.setAttributes({
        'followers.userId': userId,
        'operation': 'get_followers'
      });

      try {
        const result = await session.run(
          `
                  MATCH (follower:User)-[:FOLLOWS]->(user:User {id: $userId})
                  RETURN follower.id as id
                  ORDER BY follower.id
              `,
          { userId }
        );

        const followers = result.records.map((record) => record.get("id"));
        span.setAttributes({
          'followers.count': followers.length
        });
        span.setStatus({ code: 1 });
        return followers;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
        console.error("Error getting followers:", error);
        throw error;
      } finally {
        await session.close();
        span.end();
      }
    });
  }

  async getFollowing(userId) {
    return tracer.startActiveSpan('getFollowing', async (span) => {
      const session = this.getDriver().session();
      span.setAttributes({
        'followers.userId': userId,
        'operation': 'get_following'
      });

      try {
        const result = await session.run(
          `
                  MATCH (user:User {id: $userId})-[:FOLLOWS]->(following:User)
                  RETURN following.id as id
                  ORDER BY following.id
              `,
          { userId }
        );

        const following = result.records.map((record) => record.get("id"));
        span.setAttributes({
          'following.count': following.length
        });
        span.setStatus({ code: 1 });
        return following;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
        console.error("Error getting following:", error);
        throw error;
      } finally {
        await session.close();
        span.end();
      }
    });
  }

  async isFollowing(followerId, followeeId) {
    return tracer.startActiveSpan('isFollowing', async (span) => {
      const session = this.getDriver().session();
      span.setAttributes({
        'followers.followerId': followerId,
        'followers.followeeId': followeeId,
        'operation': 'is_following'
      });

      try {
        const result = await session.run(
          `
                  MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followee:User {id: $followeeId})
                  RETURN COUNT(r) > 0 as isFollowing
              `,
          { followerId, followeeId }
        );

        const isFollowing = result.records[0]?.get("isFollowing") || false;
        span.setAttributes({
          'followers.isFollowing': isFollowing
        });
        span.setStatus({ code: 1 });
        return isFollowing;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
        console.error("Error checking follow status:", error);
        throw error;
      } finally {
        await session.close();
        span.end();
      }
    });
  }

  async getFollowedUserIds(userId) {
    return tracer.startActiveSpan('getFollowedUserIds', async (span) => {
      const session = this.getDriver().session();
      span.setAttributes({
        'followers.userId': userId,
        'operation': 'get_followed_user_ids'
      });

      try {
        const result = await session.run(
          `
                  MATCH (user:User {id: $userId})-[:FOLLOWS]->(following:User)
                  RETURN COLLECT(following.id) as followedIds
              `,
          { userId }
        );

        const followedIds = result.records[0]?.get("followedIds") || [];
        span.setAttributes({
          'followedIds.count': followedIds.length
        });
        span.setStatus({ code: 1 });
        return followedIds;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
        console.error("Error getting followed user IDs:", error);
        throw error;
      } finally {
        await session.close();
        span.end();
      }
    });
  }

  async getAllUserIds(currentUserId) {
    return tracer.startActiveSpan('getAllUserIds', async (span) => {
      const session = this.getDriver().session();
      span.setAttributes({
        'followers.currentUserId': currentUserId,
        'operation': 'get_all_user_ids'
      });

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

        const userIds = result.records.map((record) => record.get("id"));
        span.setAttributes({
          'userIds.count': userIds.length
        });
        span.setStatus({ code: 1 });
        return userIds;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
        console.error("Error getting all user IDs:", error);
        throw error;
      } finally {
        await session.close();
        span.end();
      }
    });
  }
}

module.exports = new FollowersService();
