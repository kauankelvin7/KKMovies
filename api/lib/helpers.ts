import type { VercelRequest, VercelResponse } from '@vercel/node';

export function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  return res;
}

export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    cors(res).status(204).end();
    return true;
  }
  return false;
}

export function logDebug(label: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const prefix = `[DEBUG ${timestamp}] ${label}`;
  if (data === undefined) {
    console.log(prefix);
  } else if (data instanceof Error) {
    console.error(`${prefix} ERROR:`, data.message, data.stack);
  } else {
    console.log(prefix, typeof data === 'object' ? JSON.stringify(data, null, 0) : data);
  }
}

export function handleError(
  res: VercelResponse,
  error: unknown,
  message: string = 'Internal server error',
  statusCode: number = 500,
) {
  const err = error as Error & { code?: string; status?: number };
  const errMsg = err?.message || 'Unknown error';
  const errStack = err?.stack;
  const errCode = err?.code;

  console.error(`[ERROR] ${message}:`, {
    message: errMsg,
    code: errCode,
    stack: errStack,
  });

  const safeStatusCode =
    typeof err?.status === 'number' && err.status >= 400 && err.status < 600
      ? err.status
      : statusCode;

  return cors(res).status(safeStatusCode).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? errMsg : 'An error occurred',
    timestamp: new Date().toISOString(),
  });
}

export function validateRequiredParams(
  params: Record<string, unknown>,
  required: string[],
): string | null {
  for (const key of required) {
    if (params[key] === undefined || params[key] === null || params[key] === '') {
      return `Missing required parameter: ${key}`;
    }
  }
  return null;
}

export function safeParseInt(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

export function getQueryParam(
  req: VercelRequest,
  name: string,
  fallback?: string,
): string | undefined {
  const val = req.query[name];
  if (Array.isArray(val)) return val[0] ?? fallback;
  return (val as string) ?? fallback;
}

