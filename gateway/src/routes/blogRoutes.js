const express = require('express');
const { proxyRequest } = require('../utils/proxy');
const authMiddleware = require('../../middleware/auth_middleware');

const router = express.Router();
const BLOG_SERVICE_URL = process.env.BLOG_SERVICE_URL || 'http://localhost:3000';

// Sve blog rute - jednostavno proxy sve na blog servis
router.use('/', authMiddleware, proxyRequest(BLOG_SERVICE_URL));

module.exports = router;