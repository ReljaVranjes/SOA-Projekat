const express = require('express');
const { proxyRequest } = require('../utils/proxy');
const authMiddleware = require('../../middleware/auth_middleware');

const router = express.Router();
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:6000';

// All payment routes require authentication
router.use(authMiddleware);

// Proxy everything to payment service
router.use('/', proxyRequest(PAYMENT_SERVICE_URL));

module.exports = router;