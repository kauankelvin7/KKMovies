import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTMDBClient } from '../../lib/tmdb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  try {
    const tmdb = await getTMDBClient();
    const { data } = await tmdb.get(`/tv/${id}/credits`);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching series credits:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch series credits' });
  }
}
