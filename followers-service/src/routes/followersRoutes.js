const express = require("express");
const router = express.Router();
const followersController = require("../controllers/followersController");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

router.use(authMiddleware);

router.post("/follow/:followeeId", followersController.followUser);
router.delete("/unfollow/:followeeId", followersController.unfollowUser);

router.get("/followers/:userId", followersController.getFollowers);
router.get("/following/:userId", followersController.getFollowing);

router.get("/my-followers", followersController.getMyFollowers);
router.get("/my-following", followersController.getMyFollowing);

router.get("/is-following/:userId", followersController.checkFollowStatus);

router.get("/recommendations", followersController.getRecommendations);
router.get("/mutual/:targetUserId", followersController.getMutualFollows);
router.get("/popular", followersController.getPopularUsers);

router.get("/followed-ids", followersController.getFollowedUserIds);
router.get("/all-users", followersController.getAllUsers);

module.exports = router;
