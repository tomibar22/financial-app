// api/notion.js
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    try {
      // Extract path from request URL (remove /api/notion)
      const urlPath = req.url.replace(/^\/api\/notion/, '');
      const notionUrl = `https://api.notion.com${urlPath}`;
      
      console.log(`Proxying request to: ${notionUrl}`);
      
      // Forward headers (especially Authorization)
      const headers = { ...req.headers };
      
      // Remove host-related headers that could cause issues
      delete headers.host;
      delete headers['x-forwarded-host'];
      delete headers['x-forwarded-proto'];
      delete headers['x-forwarded-port'];
      delete headers['x-real-ip'];
      
      // Add Notion version if not present
      if (!headers['notion-version']) {
        headers['notion-version'] = '2022-06-28';
      }
      
      // Forward the request to Notion API
      const fetchOptions = {
        method: req.method,
        headers: headers,
      };
      
      // Add body for non-GET requests
      if (req.method !== 'GET' && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }
      
      // Make the request to Notion
      const response = await fetch(notionUrl, fetchOptions);
      
      // Get the response as text first (to properly handle any content type)
      const responseText = await response.text();
      
      // Try to parse as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }
      
      // Forward the status and response
      res.status(response.status).json(responseData);
    } catch (error) {
      console.error('Notion API proxy error:', error);
      res.status(500).json({ 
        error: 'Error proxying to Notion API', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };