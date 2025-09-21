const neo4jConnection = require("../config/neo4j");
const neo4j = require("neo4j-driver");

class RecommendationService {
  getDriver() {
    return neo4jConnection.getDriver();
  }

  async getFollowRecommendations(userId, limit = 10) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(
        `
                MATCH (user:User {id: $userId})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(recommendation:User)
                WHERE recommendation.id <> $userId 
                AND NOT (user)-[:FOLLOWS]->(recommendation)
                WITH recommendation, COUNT(*) as mutualConnections
                ORDER BY mutualConnections DESC
                LIMIT $limit
                RETURN recommendation.id as id, 
                       mutualConnections
            `,
        { userId, limit: neo4j.int(limit) }
      );

      const recommendations = result.records.map((record) => ({
        id: record.get("id"),
        mutualConnections: record.get("mutualConnections").toNumber(),
        reason: "Followed by people you follow",
      }));

      console.log(`Found ${recommendations.length} recommendations from mutual follows:`, recommendations.map(r => r.id));

      if (recommendations.length < limit) {
        const existingUserIds = recommendations.map(rec => rec.id);
        console.log(`Need ${limit - recommendations.length} more recommendations, excluding:`, existingUserIds);
        const additionalRecs = await this.getRoleBasedRecommendations(
          userId,
          limit - recommendations.length,
          existingUserIds
        );
        console.log(`Found ${additionalRecs.length} additional recommendations:`, additionalRecs.map(r => r.id));
        recommendations.push(...additionalRecs);
      }

      return recommendations;
    } catch (error) {
      console.error("Error getting follow recommendations:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getRoleBasedRecommendations(userId, limit = 5, excludeUserIds = []) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(
        `
                MATCH (user:User {id: $userId})
                MATCH (recommendation:User)
                WHERE recommendation.id <> $userId 
                AND NOT (user)-[:FOLLOWS]->(recommendation)
                AND NOT recommendation.id IN $excludeUserIds
                WITH recommendation
                ORDER BY recommendation.id
                LIMIT $limit
                RETURN recommendation.id as id
            `,
        { userId, limit: neo4j.int(limit), excludeUserIds }
      );

      const suggestions = result.records.map((record) => ({
        id: record.get("id"),
        mutualConnections: 0,
        reason: "Suggested for you",
      }));
      
      console.log(`Role-based recommendations found ${suggestions.length} users:`, suggestions.map(r => r.id));
      console.log(`Excluded users:`, excludeUserIds);
      
      return suggestions;
    } catch (error) {
      console.error("Error getting role-based recommendations:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getMutualFollows(userId, targetUserId) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(
        `
                MATCH (user:User {id: $userId})-[:FOLLOWS]->(mutual:User)<-[:FOLLOWS]-(target:User {id: $targetUserId})
                RETURN mutual.id as id, mutual.username as username, mutual.role as role
                ORDER BY mutual.username
            `,
        { userId, targetUserId }
      );

      return result.records.map((record) => ({
        id: record.get("id"),
        username: record.get("username"),
        role: record.get("role"),
      }));
    } catch (error) {
      console.error("Error getting mutual follows:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getPopularUsers(limit = 10) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(
        `
                MATCH (user:User)<-[:FOLLOWS]-(follower:User)
                WITH user, COUNT(follower) as followerCount
                WHERE followerCount > 0
                WITH user, followerCount
                ORDER BY followerCount DESC
                LIMIT $limit
                RETURN user.id as id, 
                       followerCount
            `,
        { limit: neo4j.int(limit) }
      );

      return result.records.map((record) => ({
        id: record.get("id"),
        followerCount: record.get("followerCount").toNumber(),
      }));
    } catch (error) {
      console.error("Error getting popular users:", error);
      throw error;
    } finally {
      await session.close();
    }
  }
}

module.exports = new RecommendationService();
