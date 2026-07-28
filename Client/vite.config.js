import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const clientRoot = path.resolve(__dirname);
const publicRoot = path.join(clientRoot, 'public');

function resolveStandaloneHtmlPath(urlPath) {
  const normalized = urlPath.split('?')[0];

  const staticMatches = new Map([
    ['/about', path.join(publicRoot, 'about', 'index.html')],
    ['/about/', path.join(publicRoot, 'about', 'index.html')],
    ['/blog', path.join(publicRoot, 'blog', 'index.html')],
    ['/blog/', path.join(publicRoot, 'blog', 'index.html')],
    ['/contact', path.join(publicRoot, 'contact', 'index.html')],
    ['/contact/', path.join(publicRoot, 'contact', 'index.html')],
    ['/legal-pages/privacy-policy', path.join(publicRoot, 'legal-pages', 'privacy-policy', 'index.html')],
    ['/legal-pages/privacy-policy/', path.join(publicRoot, 'legal-pages', 'privacy-policy', 'index.html')],
  ]);

  const exactMatch = staticMatches.get(normalized);
  if (exactMatch && fs.existsSync(exactMatch)) {
    return exactMatch;
  }

  const blogSlugMatch = normalized.match(/^\/blog\/([^/]+)\/?$/);
  if (blogSlugMatch) {
    const blogPostPath = path.join(publicRoot, 'blog', blogSlugMatch[1], 'index.html');
    if (fs.existsSync(blogPostPath)) {
      return blogPostPath;
    }
  }

  return null;
}

function resolveStandalonePublicUrl(urlPath) {
  const htmlPath = resolveStandaloneHtmlPath(urlPath);
  if (!htmlPath) {
    return null;
  }

  return `/${path.relative(publicRoot, htmlPath).replaceAll(path.sep, '/')}`;
}

function standaloneRoutePlugin() {
  return {
    name: 'standalone-route-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || req.method !== 'GET') {
          next();
          return;
        }

        const requestPath = req.url.split('?')[0];

        if (
          requestPath.startsWith('/src/')
          || requestPath.startsWith('/node_modules/')
          || requestPath.startsWith('/@vite/')
          || requestPath.startsWith('/@react-refresh')
          || requestPath.startsWith('/api/')
          || requestPath.startsWith('/uploads/')
          || path.extname(requestPath)
        ) {
          next();
          return;
        }

        const rewrittenPublicUrl = resolveStandalonePublicUrl(requestPath);
        if (!rewrittenPublicUrl) {
          next();
          return;
        }

        req.url = rewrittenPublicUrl;
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), standaloneRoutePlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
