import { Router } from 'express';
import { FollowController } from '../controllers/followController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const followController = new FollowController();

router.post('/:userId/follow', authenticateToken, followController.followUser.bind(followController));

router.delete('/:userId/unfollow', authenticateToken, followController.unfollowUser.bind(followController));

router.get('/:userId/followers', authenticateToken, followController.getFollowers.bind(followController));

router.get('/:userId/following', authenticateToken, followController.getFollowing.bind(followController));

router.get('/:userId/status', authenticateToken, followController.getFollowStatus.bind(followController));

router.get('/recommendations', authenticateToken, followController.getRecommendations.bind(followController));

router.get('/can-read/:authorId', authenticateToken, followController.canReadBlogs.bind(followController));

export default router;