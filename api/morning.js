// api/morning.js
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
    // Extract path from request URL (remove /api/morning)
    const urlPath = req.url.replace(/^\/api\/morning/, '');
    const morningUrl = `https://api.greeninvoice.co.il${urlPath}`;
    
    console.log(`Proxying request to: ${morningUrl}`);
    
    // Get the request body for POST requests
    let body = null;
    if (req.method === 'POST' && req.body) {
      body = JSON.stringify(req.body);
    }
    
    // Make the request to Morning API
    const response = await fetch(morningUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward Authorization header if present
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      // Only include body for POST/PUT requests
      ...(body && { body })
    });
    
    // Get the response as text
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
    console.error('Morning API proxy error:', error);
    res.status(500).json({ error: 'Error proxying to Morning API', message: error.message });
  }
};