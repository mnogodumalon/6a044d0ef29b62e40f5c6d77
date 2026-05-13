import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Test1223XxeErfassung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [test1223XxeErfassung, setTest1223XxeErfassung] = useState<Test1223XxeErfassung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [test1223XxeErfassungData] = await Promise.all([
        LivingAppsService.getTest1223XxeErfassung(),
      ]);
      setTest1223XxeErfassung(test1223XxeErfassungData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [test1223XxeErfassungData] = await Promise.all([
          LivingAppsService.getTest1223XxeErfassung(),
        ]);
        setTest1223XxeErfassung(test1223XxeErfassungData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  return { test1223XxeErfassung, setTest1223XxeErfassung, loading, error, fetchAll };
}