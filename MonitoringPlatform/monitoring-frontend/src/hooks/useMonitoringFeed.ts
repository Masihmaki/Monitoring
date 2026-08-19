import { useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { fetchAlerts, fetchMetrics } from '../api/monitoringApi';
import { UnauthorizedError } from '../api/http';
import type { Session } from '../auth/session';
import { API_BASE_URL } from '../config/app';
import type { Alert, Metric } from '../types/monitoring';

type Feed = {
  metrics: Metric[];
  alerts: Alert[];
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useMonitoringFeed(
  session: Session,
  onUnauthorized: () => void,
): Feed {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [nextMetrics, nextAlerts] = await Promise.all([
        fetchMetrics(session.accessToken),
        fetchAlerts(session.accessToken),
      ]);
      setMetrics(nextMetrics);
      setAlerts(nextAlerts);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [session.accessToken, onUnauthorized]);

  useEffect(() => {
    void refresh();

    const socket = io(API_BASE_URL, {
      auth: { token: session.accessToken },
    });

    socket.on('newMetric', (newMetric: Metric) => {
      setMetrics((prev) => [newMetric, ...prev.slice(0, 99)]);
    });

    socket.on('newAlert', (newAlert: Alert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [session.accessToken, refresh]);

  return { metrics, alerts, loading, refresh };
}
