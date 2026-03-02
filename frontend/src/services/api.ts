/* KauanFlix — API Service with request queue and 429 retry */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ---- Request Queue (limits concurrent requests) ---- */
const MAX_CONCURRENT = 3;
let activeRequests = 0;
const pendingQueue: Array<() => void> = [];

function enqueue(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise<void>(resolve => {
    pendingQueue.push(() => {
      activeRequests++;
      resolve();
    });
  });
}

function dequeue(): void {
  activeRequests--;
  if (pendingQueue.length > 0) {
    const next = pendingQueue.shift();
    if (next) next();
  }
}

/* ---- Rate limit event for UI feedback ---- */
type RateLimitListener = (isLimited: boolean) => void;
const rateLimitListeners: Set<RateLimitListener> = new Set();

export function onRateLimitChange(listener: RateLimitListener): () => void {
  rateLimitListeners.add(listener);
  return () => rateLimitListeners.delete(listener);
}

function notifyRateLimit(isLimited: boolean) {
  rateLimitListeners.forEach(fn => fn(isLimited));
}

/* ---- Axios Instance ---- */
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

/* Request interceptor: queue control */
api.interceptors.request.use(async (config) => {
  await enqueue();
  return config;
});

/* Response interceptor: dequeue + retry on 429 */
api.interceptors.response.use(
  (response) => {
    dequeue();
    return response;
  },
  async (error: AxiosError) => {
    dequeue();

    // Handle 429 Rate Limit with exponential backoff
    if (error.response?.status === 429) {
      const config = error.config as InternalAxiosRequestConfig & { __retryCount?: number };
      if (!config) return Promise.reject(error);

      const retryCount = config.__retryCount || 0;
      const maxRetries = 3;

      if (retryCount < maxRetries) {
        config.__retryCount = retryCount + 1;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        console.warn(`⚠️ 429 Rate Limit (tentativa ${retryCount + 1}/${maxRetries}), aguardando ${delay}ms...`);
        notifyRateLimit(true);
        await new Promise(resolve => setTimeout(resolve, delay));
        notifyRateLimit(false);
        return api.request(config);
      }

      notifyRateLimit(false);
      return Promise.reject(new Error('Muitas requisições. Aguarde um momento e tente novamente.'));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('A requisição expirou. Tente novamente.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('Erro de conexão. Verifique sua internet.'));
    }
    return Promise.reject(error);
  }
);

export default api;
