import { useEffect, useState } from 'react';
import { fetchReviewStatsApi, ReviewStats } from './reviewsApi';

/**
 * Real review numbers (approved reviews only) for badges around the site.
 * Returns null until loaded or if loading fails — callers must hide the
 * badge in that case instead of showing an invented number.
 */
export function useReviewStats(): ReviewStats | null {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  useEffect(() => {
    let alive = true;
    fetchReviewStatsApi()
      .then(s => { if (alive) setStats(s); })
      .catch(() => { if (alive) setStats(null); });
    return () => { alive = false; };
  }, []);
  return stats;
}
