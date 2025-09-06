const express = require('express');
const { proxyRequest } = require('../utils/proxy');

const router = express.Router();
const BLOG_SERVICE_URL = process.env.BLOG_SERVICE_URL || 'http://localhost:3000';

// Sve blog rute - jednostavno proxy sve na blog servis
router.use('/', proxyRequest(BLOG_SERVICE_URL));

module.exports = router;