import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: true,
      clientPort: 5173,
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        configure: (proxy: any, _options: any) => {
          proxy.on('proxyRes', (proxyRes: any, _req: any, res: any) => {
            const setCookieHeaders = proxyRes.headers['set-cookie'];
            if (setCookieHeaders) {
              res.setHeader('Set-Cookie', setCookieHeaders);
            }
          });
        },
      },
      '/api/users': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        configure: (proxy: any, _options: any) => {
          proxy.on('proxyRes', (proxyRes: any, _req: any, res: any) => {
            const setCookieHeaders = proxyRes.headers['set-cookie'];
            if (setCookieHeaders) {
              res.setHeader('Set-Cookie', setCookieHeaders);
            }
          });
        },
      },
      '/api/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        configure: (proxy: any, _options: any) => {
          proxy.on('proxyRes', (proxyRes: any, _req: any, res: any) => {
            const setCookieHeaders = proxyRes.headers['set-cookie'];
            if (setCookieHeaders) {
              res.setHeader('Set-Cookie', setCookieHeaders);
            }
          });
        },
      },
      '/api/stock': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        configure: (proxy: any, _options: any) => {
          proxy.on('proxyRes', (proxyRes: any, _req: any, res: any) => {
            const setCookieHeaders = proxyRes.headers['set-cookie'];
            if (setCookieHeaders) {
              res.setHeader('Set-Cookie', setCookieHeaders);
            }
          });
        },
      },
      '/api/earnings': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        configure: (proxy: any, _options: any) => {
          proxy.on('proxyRes', (proxyRes: any, _req: any, res: any) => {
            const setCookieHeaders = proxyRes.headers['set-cookie'];
            if (setCookieHeaders) {
              res.setHeader('Set-Cookie', setCookieHeaders);
            }
          });
        },
      },
      '/api/chat': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        configure: (proxy: any, _options: any) => {
          proxy.on('proxyRes', (proxyRes: any, _req: any, res: any) => {
            const setCookieHeaders = proxyRes.headers['set-cookie'];
            if (setCookieHeaders) {
              res.setHeader('Set-Cookie', setCookieHeaders);
            }
          });
        },
      },
      '/api/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        configure: (proxy: any, _options: any) => {
          proxy.on('proxyRes', (proxyRes: any, _req: any, res: any) => {
            const setCookieHeaders = proxyRes.headers['set-cookie'];
            if (setCookieHeaders) {
              res.setHeader('Set-Cookie', setCookieHeaders);
            }
          });
        },
      },
    },
  },
})
