import type { Plugin } from 'vite';

export const watchCsp = [
  "default-src 'none'",
  "manifest-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  'frame-src https://warezcdn.sbs',
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

export const watchHeaders = {
  'Content-Security-Policy': watchCsp,
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), clipboard-write=(), fullscreen=(self "https://warezcdn.sbs"), autoplay=(self "https://warezcdn.sbs"), encrypted-media=(self "https://warezcdn.sbs"), picture-in-picture=(self "https://warezcdn.sbs")',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cache-Control': 'no-store',
};

export function isolatedWatchRoute(): Plugin {
  const middleware = (development: boolean) => (req: any, res: any, next: () => void) => {
    const path = (req.url || '').split('?')[0];
    if (/^\/watch(?:\/|$|\.html$)/.test(path)) {
      for (const [name, value] of Object.entries(watchHeaders)) {
        // Vite's React refresh preamble needs inline scripts and its websocket in dev only.
        const header = development && name === 'Content-Security-Policy'
          ? value.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'").replace("style-src 'self'", "style-src 'self' 'unsafe-inline'").replace("connect-src 'self'", "connect-src 'self' ws://localhost:3000 ws://127.0.0.1:3000")
          : value;
        res.setHeader(name, header);
      }
      req.url = '/watch.html';
    }
    next();
  };
  return {
    name: 'isolated-watch-route',
    configureServer(server) { server.middlewares.use(middleware(true)); },
    configurePreviewServer(server) { server.middlewares.use(middleware(false)); },
  };
}
