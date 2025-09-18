const express = require('express');
const { proxyRequest } = require('../utils/proxy');
const authMiddleware = require('../../middleware/auth_middleware');

const router = express.Router();
const STAKEHOLDERS_SERVICE_URL = process.env.STAKEHOLDERS_SERVICE_URL || 'http://localhost:4000';

// Public
router.all('/login',    proxyRequest(STAKEHOLDERS_SERVICE_URL));
router.all('/register', proxyRequest(STAKEHOLDERS_SERVICE_URL));

// Protected (everything else)
router.use(authMiddleware);
router.use('/', proxyRequest(STAKEHOLDERS_SERVICE_URL));

module.exports = router;