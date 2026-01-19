import { Request, Response, NextFunction } from 'express';

/**
 * Cache middleware para otimizar respostas da API
 */

interface CacheOptions {
  ttl?: number; // Time to live em segundos
  private?: boolean; // Se o cache deve ser privado
}

const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * Middleware de cache simples em memória
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const { ttl = 300, private: isPrivate = false } = options; // 5 minutos default

  return (req: Request, res: Response, next: NextFunction) => {
    // Apenas cacheia GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cached = cache.get(key);

    // Verifica se tem cache válido
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      console.log(`[Cache] Hit: ${key}`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', isPrivate ? 'private' : `public, max-age=${ttl}`);
      return res.json(cached.data);
    }

    // Intercepta o json() para cachear a resposta
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      cache.set(key, { data, timestamp: Date.now(), ttl });
      console.log(`[Cache] Miss: ${key}`);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', isPrivate ? 'private' : `public, max-age=${ttl}`);
      
      // Limpa cache antigo periodicamente
      cleanOldCache();
      
      return originalJson(data);
    };

    next();
  };
};

/**
 * Limpa entradas antigas do cache
 */
function cleanOldCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl * 1000) {
      cache.delete(key);
    }
  }
}

/**
 * Middleware para adicionar headers de cache HTTP
 */
export const httpCacheMiddleware = (maxAge: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      res.setHeader('Vary', 'Accept-Encoding');
    }
    next();
  };
};

/**
 * Middleware para comprimir respostas
 */
export const compressionMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    if (acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
    } else if (acceptEncoding.includes('deflate')) {
      res.setHeader('Content-Encoding', 'deflate');
    }
    
    next();
  };
};

/**
 * Limpa todo o cache manualmente
 */
export const clearCache = () => {
  cache.clear();
  console.log('[Cache] Cache limpo manualmente');
};

/**
 * Remove uma entrada específica do cache
 */
export const removeFromCache = (key: string) => {
  cache.delete(key);
  console.log(`[Cache] Removido: ${key}`);
};

export default cacheMiddleware;
