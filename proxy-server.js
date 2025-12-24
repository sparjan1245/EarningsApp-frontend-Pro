const proxy = require('http-proxy-middleware');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Proxy configuration
const apiProxy = proxy.createProxyMiddleware({
  target: 'https://localhost:3000', // Your gateway
  changeOrigin: true,
  secure: false, // Allow self-signed certificates
  logLevel: 'debug',
});

const frontendProxy = proxy.createProxyMiddleware({
  target: 'https://localhost:5174', // Vite dev server
  changeOrigin: true,
  secure: false, // Allow self-signed certificates
  logLevel: 'debug',
});

// Routes
app.use('/api', apiProxy);
app.use('/', frontendProxy);

app.listen(PORT, () => {
  console.log(`Custom proxy server running at https://localhost:${PORT}`);
}); 