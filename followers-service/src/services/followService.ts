import { getSession } from '../config/neo4j';
import { User, FollowResponse } from '../models/User';

export class FollowService {
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    const session = getSession();
    
    try {
      if (followerId === followingId) {
        throw new Error('Cannot follow yourself');
      }

      const result = await session.run(`
        MERGE (follower:User {id: $followerId})
        MERGE (following:User {id: $followingId})
        MERGE (follower)-[r:FOLLOWS]->(following)
        ON CREATE SET r.createdAt = datetime()
        RETURN r
      `, { followerId, followingId });

      return result.records.length > 0;
    } finally {
      await session.close();
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const session = getSession();
    
    try {
      const result = await session.run(`
        MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(following:User {id: $followingId})
        DELETE r
        RETURN count(r) as deleted
      `, { followerId, followingId });

      const deleted = result.records[0]?.get('deleted').toNumber() || 0;
      return deleted > 0;
    } finally {
      await session.close();
    }
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20): Promise<string[]> {
    const session = getSession();
    
    try {
      const skip = (page - 1) * limit;
      
      const result = await session.run(`
        MATCH (follower:User)-[:FOLLOWS]->(user:User {id: $userId})
        RETURN follower.id as followerId
        SKIP $skip
        LIMIT $limit
      `, { userId, skip, limit });

      return result.records.map(record => record.get('followerId'));
    } finally {
      await session.close();
    }
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20): Promise<string[]> {
    const session = getSession();
    
    try {
      const skip = (page - 1) * limit;
      
      const result = await session.run(`
        MATCH (user:User {id: $userId})-[:FOLLOWS]->(following:User)
        RETURN following.id as followingId
        SKIP $skip
        LIMIT $limit
      `, { userId, skip, limit });

      return result.records.map(record => record.get('followingId'));
    } finally {
      await session.close();
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const session = getSession();
    
    try {
      const result = await session.run(`
        MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(following:User {id: $followingId})
        RETURN count(r) > 0 as isFollowing
      `, { followerId, followingId });

      return result.records[0]?.get('isFollowing') || false;
    } finally {
      await session.close();
    }
  }

  async getFollowCounts(userId: string): Promise<{ followersCount: number; followingCount: number }> {
    const session = getSession();
    
    try {
      const result = await session.run(`
        MATCH (user:User {id: $userId})
        OPTIONAL MATCH (follower:User)-[:FOLLOWS]->(user)
        OPTIONAL MATCH (user)-[:FOLLOWS]->(following:User)
        RETURN count(DISTINCT follower) as followersCount, 
               count(DISTINCT following) as followingCount
      `, { userId });

      const record = result.records[0];
      return {
        followersCount: record.get('followersCount').toNumber(),
        followingCount: record.get('followingCount').toNumber()
      };
    } finally {
      await session.close();
    }
  }

  async getRecommendations(userId: string, limit: number = 10): Promise<string[]> {
    const session = getSession();
    
    try {
      const result = await session.run(`
        MATCH (user:User {id: $userId})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(recommendation:User)
        WHERE recommendation.id <> $userId 
          AND NOT (user)-[:FOLLOWS]->(recommendation)
        RETURN recommendation.id as recommendedId, count(*) as mutualFriends
        ORDER BY mutualFriends DESC
        LIMIT $limit
      `, { userId, limit });

      return result.records.map(record => record.get('recommendedId'));
    } finally {
      await session.close();
    }
  }

  async canReadBlogs(readerId: string, authorId: string): Promise<boolean> {
    if (readerId === authorId) {
      return true;
    }

    return await this.isFollowing(readerId, authorId);
  }
}