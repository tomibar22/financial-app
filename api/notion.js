// api/notion.js
const { createProxyMiddleware } = require('http-proxy-middleware');

// This is only used in development
// In production, the Vercel platform handles this differently
if (process.env.NODE_ENV === 'development') {
  module.exports = (req, res) => {
    let proxy = createProxyMiddleware({
      target: 'https://api.notion.com',
      changeOrigin: true,
      pathRewrite: { '^/api/notion': '' },
    });
    
    proxy(req, res);
  };
} else {
  // For Vercel production environment
  module.exports = async (req, res) => {
    // Extract the path without the /api/notion prefix
    const path = req.url.replace(/^\/api\/notion/, '');
    
    // Reconstruct the full Notion API URL
    const notionUrl = `https://api.notion.com${path}`;
    
    // Prepare headers
    const headers = {
      ...req.headers,
      host: 'api.notion.com',
    };
    
    delete headers['x-forwarded-host'];
    
    try {
      // Make the request to Notion
      const notionResponse = await fetch(notionUrl, {
        method: req.method,
        headers: headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      });
      
      // Get response data
      const data = await notionResponse.text();
      
      // Set response headers
      for (const [key, value] of notionResponse.headers.entries()) {
        res.setHeader(key, value);
      }
      
      // Send response
      res.status(notionResponse.status).send(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}