import type { Plugin } from 'vite';

export function releasePlugin(version: string): Plugin {
  const metadata = JSON.stringify({ version });
  const middleware = (development: boolean) => (req: any, res: any, next: () => void) => {
    const path = (req.url || '').split('?')[0];
    if (path === '/version.json' || path === '/sw.js') res.setHeader('Cache-Control', 'no-store');
    else if (!/^\/(watch|api)(?:\/|$|\.html$)/.test(path) && (!path.includes('.') || path.endsWith('.html'))) res.setHeader('Cache-Control', 'no-cache');
    if (development && path === '/version.json') {
      res.setHeader('Content-Type', 'application/json'); res.end(metadata); return;
    }
    next();
  };
  return {
    name: 'release-metadata',
    configureServer(server) { server.middlewares.use(middleware(true)); },
    configurePreviewServer(server) { server.middlewares.use(middleware(false)); },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: metadata });
      this.emitFile({ type: 'asset', fileName: `sw-version-${version}.js`, source: `self.addEventListener('message', function(event) { if (event.data && event.data.type === 'GET_APP_VERSION' && event.ports[0]) event.ports[0].postMessage(${metadata}); });` });
    },
  };
}
