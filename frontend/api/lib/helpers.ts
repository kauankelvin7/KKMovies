import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to add CORS headers
export function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

// Helper to handle OPTIONS request
export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    cors(res).status(200).end();
    return true;
  }
  return false;
}

// Error handler
export function handleError(res: VercelResponse, error: any, message: string = 'Internal server error') {
  console.error(message, error);
  return cors(res).status(500).json({ 
    error: message, 
    details: error.message || 'Unknown error' 
  });
}
