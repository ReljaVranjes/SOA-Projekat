const express = require('express');
const { proxyRequest } = require('../utils/proxy');

const router = express.Router();
const TOURS_SERVICE_URL = process.env.TOURS_SERVICE_URL || 'http://localhost:5000';

// Sve tours rute
router.use('/', proxyRequest(TOURS_SERVICE_URL));

module.exports = router;