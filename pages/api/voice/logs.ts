import { NextApiRequest, NextApiResponse } from 'next';
import { audioLogger } from '@/lib/audio-logger';
import { isAuthenticated, hasRole } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // بررسی احراز هویت و دسترسی
  const auth = await isAuthenticated(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!hasRole(auth, ['admin', 'ceo'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const lines = parseInt(req.query.lines as string) || 100;
    const logs = audioLogger.getRecentLogs(lines);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        count: logs.length,
      },
    });

  } catch (error) {
    audioLogger.error('Error fetching audio logs', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error fetching logs',
    });
  }
}
