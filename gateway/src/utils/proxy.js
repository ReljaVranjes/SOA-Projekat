const http = require('http');
const https = require('https');
const { URL } = require('url');

const proxyRequest = (targetUrl) => {
  return (req, res, next) => {
    try {
      const url = new URL(targetUrl + req.path);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      console.log(`🌐 Proxy target URL: ${url.href}`);

      // Pripremi options
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: req.method,
        headers: {
          ...req.headers,
          host: url.host // Važno za target server
        },
        timeout: 5000
      };

      console.log(`🔄 Proxying: ${req.method} ${targetUrl}${req.path}`);

      // Kreiraj zahtev
      const proxyReq = client.request(options, (proxyRes) => {
        // Forward status code
        res.status(proxyRes.statusCode);

        // Forward headers (osim onih koje mogu da prave probleme)
        Object.keys(proxyRes.headers).forEach(key => {
          if (!['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
            res.set(key, proxyRes.headers[key]);
          }
        });

        // Pipe response
        proxyRes.pipe(res);
      });

      // Error handling
      proxyReq.on('error', (error) => {
        console.error(`❌ Proxy error: ${error.message}`);
        if (!res.headersSent) {
          res.status(503).json({
            error: 'Service unavailable',
            message: error.message
          });
        }
      });

      proxyReq.on('timeout', () => {
        console.error('❌ Proxy timeout');
        proxyReq.destroy();
        if (!res.headersSent) {
          res.status(504).json({
            error: 'Gateway timeout'
          });
        }
      });

      // Pipe request body
      req.pipe(proxyReq);

    } catch (error) {
      console.error(`❌ Proxy setup error: ${error.message}`);
      res.status(500).json({
        error: 'Gateway configuration error',
        message: error.message
      });
    }
  };
};

module.exports = { proxyRequest };