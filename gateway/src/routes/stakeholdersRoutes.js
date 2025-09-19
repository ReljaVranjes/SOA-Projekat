const express = require('express');
const { proxyRequest } = require('../utils/proxy');
const authMiddleware = require('../../middleware/auth_middleware');
const grpcClient = require('../services/grpcClient');

const router = express.Router();
const STAKEHOLDERS_SERVICE_URL = process.env.STAKEHOLDERS_SERVICE_URL || 'http://localhost:4000';

// Public
router.all('/login',    proxyRequest(STAKEHOLDERS_SERVICE_URL));
router.all('/register', proxyRequest(STAKEHOLDERS_SERVICE_URL));

// Protected
router.use(authMiddleware);

// HTTP -> gRPC for block user
router.put('/users/:id/block', async (req, res) => {
  try {
    const { id: userId } = req.params;
    
    // Extract user info from headers set by auth middleware
    const userRole = req.headers['x-user-role'];
    const userEmail = req.headers['x-user-email'];
    const currentUserId = req.headers['x-user-id'];
    
    console.log(`🔄 [Gateway] Auth headers - role: ${userRole}, email: ${userEmail}, id: ${currentUserId}`);
    
    if (!userRole) {
      return res.status(401).json({ error: 'User role not found in request headers' });
    }

    // Map your app roles to proto enum
    const roleMap = {
      USER: grpcClient.UserRole.USER_ROLE_USER,
      TOURIST: grpcClient.UserRole.USER_ROLE_USER, // if your app uses "Tourist"
      ADMIN: grpcClient.UserRole.USER_ROLE_ADMIN,
      GUIDE: grpcClient.UserRole.USER_ROLE_GUIDE,
    };
    
    const roleStr = userRole.toUpperCase();
    const protoRole = roleMap[roleStr];
    if (protoRole === undefined) {
      return res.status(400).json({ error: `Invalid role specified: ${userRole}` });
    }
    console.log(`🔄 [Gateway] gRPC BlockUser -> role=${protoRole}, user_id=${userId}`);
    const response = await grpcClient.blockUser(protoRole, userId);
    return res.json({ message: response.message });
  } catch (error) {
    console.error('❌ gRPC BlockUser error:', error);
    return res.status(502).json({
      error: 'Failed to block user',
      message: error.details || error.message,
      code: error.code,
    });
  }
});

// Everything else proxies to HTTP service
router.use('/', proxyRequest(STAKEHOLDERS_SERVICE_URL));

module.exports = router;
