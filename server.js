const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
// Optional: load a local .env for dev. Won't crash if dotenv isn't installed.
try { require('dotenv').config(); } catch (e) { /* dotenv is optional */ }

const app = express();
app.use(cors());

// Proxy for Notion API — inject the API key server-side from env var
// so the real key never lives in the browser bundle.
app.use('/notion', createProxyMiddleware({
  target: 'https://api.notion.com',
  changeOrigin: true,
  pathRewrite: { '^/notion': '' },
  on: {
    proxyReq: (proxyReq) => {
      if (process.env.NOTION_API_KEY) {
        proxyReq.setHeader('authorization', `Bearer ${process.env.NOTION_API_KEY}`);
      }
    },
  },
}));

// Morning token endpoint — handled directly so OAuth credentials are injected
// server-side from env vars (never sent from the browser). Stays on api.morning.co.
app.post('/morning/idp/*', express.json(), async (req, res) => {
  try {
    const path = req.originalUrl.replace(/^\/morning/, '');
    const response = await fetch(`https://api.morning.co${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.MORNING_ID,
        client_secret: process.env.MORNING_SECRET,
      }),
    });
    const text = await response.text();
    res.status(response.status);
    try { res.json(JSON.parse(text)); } catch (e) { res.send(text); }
  } catch (error) {
    console.error('Morning token proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// All other Morning calls (documents, clients, etc.) → api.greeninvoice.co.il.
// The client adds the Bearer access token itself; no secret is involved here.
app.use('/morning', createProxyMiddleware({
  target: 'https://api.greeninvoice.co.il',
  changeOrigin: true,
  pathRewrite: { '^/morning': '' },
}));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
