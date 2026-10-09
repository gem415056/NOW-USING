import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function serveUserScriptsPlugin(): Plugin {
  return {
    name: 'serve-user-scripts',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        
        // 1. Raw installation endpoint for Tampermonkey / Violentmonkey
        if (url.pathname.startsWith('/raw/')) {
          const rawName = decodeURIComponent(url.pathname.replace('/raw/', ''));
          // match without or with .user.js
          const cleanName = rawName.replace(/\.user\.js$/, '');
          
          const possibleFiles = [
            rawName,
            cleanName,
            `${cleanName}.user.js`,
            path.join('LoreInjector', cleanName),
            path.join('ResponseRefiner', cleanName),
            path.join('used', cleanName)
          ];

          let foundPath = '';
          for (const p of possibleFiles) {
            const abs = path.resolve(process.cwd(), p);
            if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
              foundPath = abs;
              break;
            }
          }

          if (foundPath) {
            const content = fs.readFileSync(foundPath, 'utf-8');
            res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(foundPath)}.user.js"`);
            res.statusCode = 200;
            res.end(content);
            return;
          } else {
            res.statusCode = 404;
            res.end('Script file not found');
            return;
          }
        }

        // 2. API list endpoint
        if (url.pathname === '/api/scripts') {
          try {
            const scriptFiles = [
              { name: 'PASTELchat-Crack-Bridge.user.js', category: 'bridge', tag: 'Core Bridge' },
              { name: 'lore injector TEST8', category: 'lore', tag: 'Latest (TEST8)' },
              { name: 'Response Refiner TEST8', category: 'refiner', tag: 'Latest (TEST8)' },
              { name: '3in1 TEST1', category: 'utility', tag: 'Bookmark & Summary' },
              { name: '9in1 TEST1', category: 'helper', tag: 'Input Helper' },
            ];

            const scanDir = (dir: string, category: string) => {
              if (!fs.existsSync(dir)) return [];
              return fs.readdirSync(dir).map(f => ({
                name: `${dir}/${f}`,
                category,
                tag: 'Historical / Variant'
              }));
            };

            const allList = [
              ...scriptFiles,
              ...scanDir('LoreInjector', 'lore'),
              ...scanDir('ResponseRefiner', 'refiner'),
              ...scanDir('used', 'archive')
            ];

            const details = allList.map(item => {
              const abs = path.resolve(process.cwd(), item.name);
              if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null;
              const content = fs.readFileSync(abs, 'utf-8');
              const stats = fs.statSync(abs);

              // Parse UserScript metadata
              const nameMatch = content.match(/@name\s+(.+)/);
              const versionMatch = content.match(/@version\s+(.+)/);
              const descMatch = content.match(/@description\s+(.+)/);
              const authorMatch = content.match(/@author\s+(.+)/);
              const matches = Array.from(content.matchAll(/@match\s+(.+)/g)).map(m => m[1].trim());
              const requires = Array.from(content.matchAll(/@require\s+(.+)/g)).map(m => m[1].trim());

              return {
                id: item.name,
                fileName: path.basename(item.name),
                category: item.category,
                tag: item.tag,
                fileSize: stats.size,
                lineCount: content.split('\n').length,
                metaName: nameMatch ? nameMatch[1].trim() : item.name,
                version: versionMatch ? versionMatch[1].trim() : '1.0.0',
                description: descMatch ? descMatch[1].trim() : '',
                author: authorMatch ? authorMatch[1].trim() : 'Unknown',
                matches,
                requires
              };
            }).filter(Boolean);

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(details));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 3. API content endpoint
        if (url.pathname === '/api/scripts/content') {
          const scriptId = url.searchParams.get('id');
          if (!scriptId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing script id' }));
            return;
          }

          const abs = path.resolve(process.cwd(), scriptId);
          if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Script not found' }));
            return;
          }

          const content = fs.readFileSync(abs, 'utf-8');
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.statusCode = 200;
          res.end(content);
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    serveUserScriptsPlugin()
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: 'all'
  }
});
