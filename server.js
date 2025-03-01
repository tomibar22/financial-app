const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

// Proxy for Notion API
app.use('/notion', createProxyMiddleware({
  target: 'https://api.notion.com',
  changeOrigin: true,
  pathRewrite: { '^/notion': '' },
}));

// Proxy for Morning API
app.use('/morning', createProxyMiddleware({
  target: 'https://api.greeninvoice.co.il',
  changeOrigin: true,
  pathRewrite: { '^/morning': '' },
}));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});