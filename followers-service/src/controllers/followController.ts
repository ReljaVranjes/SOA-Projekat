import { Request, Response } from 'express';
import { FollowService } from '../services/followService';
import { AuthenticatedRequest } from '../middleware/auth';

const followService = new FollowService();

export class FollowController {
  async followUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const followerId = req.user?.id;

      if (!followerId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      if (followerId === userId) {
        res.status(400).json({ message: 'Cannot follow yourself' });
        return;
      }

      const success = await followService.followUser(followerId, userId);
      
      if (success) {
        res.status(201).json({ message: 'User followed successfully' });
      } else {
        res.status(400).json({ message: 'Failed to follow user' });
      }
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async unfollowUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const followerId = req.user?.id;

      if (!followerId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const success = await followService.unfollowUser(followerId, userId);
      
      if (success) {
        res.status(200).json({ message: 'User unfollowed successfully' });
      } else {
        res.status(400).json({ message: 'Not following this user' });
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getFollowers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const followers = await followService.getFollowers(userId, page, limit);
      
      res.status(200).json({
        followers,
        page,
        limit
      });
    } catch (error) {
      console.error('Error getting followers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getFollowing(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const following = await followService.getFollowing(userId, page, limit);
      
      res.status(200).json({
        following,
        page,
        limit
      });
    } catch (error) {
      console.error('Error getting following:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getFollowStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const [isFollowing, followCounts] = await Promise.all([
        followService.isFollowing(currentUserId, userId),
        followService.getFollowCounts(userId)
      ]);

      res.status(200).json({
        isFollowing,
        ...followCounts
      });
    } catch (error) {
      console.error('Error getting follow status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const recommendations = await followService.getRecommendations(userId, limit);
      
      res.status(200).json({
        recommendations
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async canReadBlogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { authorId } = req.params;
      const readerId = req.user?.id;

      if (!readerId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const canRead = await followService.canReadBlogs(readerId, authorId);
      
      res.status(200).json({
        canRead
      });
    } catch (error) {
      console.error('Error checking blog read permission:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}