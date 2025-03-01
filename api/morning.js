// api/morning.js
const { createProxyMiddleware } = require('http-proxy-middleware');

// This is only used in development
// In production, the Vercel platform handles this differently
if (process.env.NODE_ENV === 'development') {
  module.exports = (req, res) => {
    let proxy = createProxyMiddleware({
      target: 'https://api.greeninvoice.co.il',
      changeOrigin: true,
      pathRewrite: { '^/api/morning': '' },
    });
    
    proxy(req, res);
  };
} else {
  // For Vercel production environment
  module.exports = async (req, res) => {
    // Extract the path without the /api/morning prefix
    const path = req.url.replace(/^\/api\/morning/, '');
    
    // Reconstruct the full Morning API URL
    const morningUrl = `https://api.greeninvoice.co.il${path}`;
    
    // Prepare headers
    const headers = {
      ...req.headers,
      host: 'api.greeninvoice.co.il',
    };
    
    delete headers['x-forwarded-host'];
    
    try {
      // Make the request to Morning
      const morningResponse = await fetch(morningUrl, {
        method: req.method,
        headers: headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      });
      
      // Get response data
      const data = await morningResponse.text();
      
      // Set response headers
      for (const [key, value] of morningResponse.headers.entries()) {
        res.setHeader(key, value);
      }
      
      // Send response
      res.status(morningResponse.status).send(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}