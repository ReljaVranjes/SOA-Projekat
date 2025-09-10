const express = require('express');
const { createProxyMiddleware } = require('./../../node_modules/http-proxy-middleware');

const router = express.Router();

const followersServiceUrl = process.env.FOLLOWERS_SERVICE_URL || 'http://localhost:6000';

const proxyOptions = {
  target: followersServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/followers-service': ''
  },
  onError: (err, req, res) => {
    console.error('Followers service proxy error:', err.message);
    res.status(503).json({
      error: 'Followers service unavailable',
      message: 'The followers service is currently unavailable. Please try again later.'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying to followers service: ${req.method} ${req.url} -> ${followersServiceUrl}${req.url}`);
  }
};

router.use('/', createProxyMiddleware(proxyOptions));

module.exports = router;