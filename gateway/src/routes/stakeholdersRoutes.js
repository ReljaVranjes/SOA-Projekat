const express = require('express');
const { proxyRequest } = require('../utils/proxy');

const router = express.Router();
const STAKEHOLDERS_SERVICE_URL = process.env.STAKEHOLDERS_SERVICE_URL || 'http://localhost:4000';

// Sve stakeholders rute
router.use('/', proxyRequest(STAKEHOLDERS_SERVICE_URL));

module.exports = router;