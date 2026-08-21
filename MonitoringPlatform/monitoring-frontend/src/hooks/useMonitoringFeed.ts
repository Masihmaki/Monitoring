import { useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { fetchAlerts, fetchMetrics, updateAlertStatus } from '../api/monitoringApi';
import { UnauthorizedError } from '../api/http';
import type { Session } from '../auth/session';
import { API_BASE_URL } from '../config/app';
import type { Alert, Metric } from '../types/monitoring';

type Feed = {
  metrics: Metric[];
  alerts: Alert[];
  loading: boolean;
  refresh: () => Promise<void>;
  setAlertStatus: (alertId: string, status: Alert['status']) => Promise<void>;
};

function upsertAlert(list: Alert[], next: Alert): Alert[] {
  const without = list.filter((item) => item.id !== next.id);
  return [next, ...without];
}

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
        fetchMetrics(session.accessToken, session.activeOrganizationId),
        fetchAlerts(session.accessToken, session.activeOrganizationId),
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
  }, [session.accessToken, session.activeOrganizationId, onUnauthorized]);

  const setAlertStatus = useCallback(
    async (alertId: string, status: Alert['status']) => {
      try {
        const updated = await updateAlertStatus(
          session.accessToken,
          session.activeOrganizationId,
          alertId,
          status,
        );
        setAlerts((prev) => upsertAlert(prev, updated));
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          onUnauthorized();
          return;
        }
        console.error('Error updating alert:', error);
      }
    },
    [session.accessToken, session.activeOrganizationId, onUnauthorized],
  );

  useEffect(() => {
    void refresh();

    const socket = io(API_BASE_URL, {
      auth: {
        token: session.accessToken,
        organizationId: session.activeOrganizationId,
      },
    });

    socket.on('newMetric', (newMetric: Metric) => {
      setMetrics((prev) => [newMetric, ...prev.slice(0, 99)]);
    });

    socket.on('newAlert', (newAlert: Alert) => {
      setAlerts((prev) => upsertAlert(prev, newAlert));
    });

    socket.on('alertUpdated', (updated: Alert) => {
      setAlerts((prev) => upsertAlert(prev, updated));
    });

    return () => {
      socket.disconnect();
    };
  }, [session.accessToken, session.activeOrganizationId, refresh]);

  return { metrics, alerts, loading, refresh, setAlertStatus };
}
