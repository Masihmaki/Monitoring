import { useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { UnauthorizedError } from '../api/http';
import { createMonitor, deleteMonitor, fetchMonitors } from '../api/monitorsApi';
import type { Session } from '../auth/session';
import { API_BASE_URL } from '../config/app';
import type { CreateMonitorInput, Monitor } from '../types/monitoring';

type MonitorsFeed = {
  monitors: Monitor[];
  loading: boolean;
  saving: boolean;
  error: string;
  refresh: () => Promise<void>;
  addMonitor: (input: CreateMonitorInput) => Promise<boolean>;
  removeMonitor: (id: string) => Promise<void>;
};

function upsertMonitor(list: Monitor[], next: Monitor): Monitor[] {
  const without = list.filter((item) => item.id !== next.id);
  return [next, ...without];
}

export function useMonitors(
  session: Session,
  onUnauthorized: () => void,
): MonitorsFeed {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const next = await fetchMonitors(
        session.accessToken,
        session.activeOrganizationId,
      );
      setMonitors(next);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }
      console.error('Error fetching monitors:', err);
    } finally {
      setLoading(false);
    }
  }, [session.accessToken, session.activeOrganizationId, onUnauthorized]);

  const addMonitor = useCallback(
    async (input: CreateMonitorInput): Promise<boolean> => {
      setError('');
      setSaving(true);
      try {
        const created = await createMonitor(
          session.accessToken,
          session.activeOrganizationId,
          input,
        );
        setMonitors((prev) => upsertMonitor(prev, created));
        return true;
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          onUnauthorized();
          return false;
        }
        setError(err instanceof Error ? err.message : 'افزودن سایت ناموفق بود');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [session.accessToken, session.activeOrganizationId, onUnauthorized],
  );

  const removeMonitor = useCallback(
    async (id: string) => {
      setError('');
      try {
        await deleteMonitor(
          session.accessToken,
          session.activeOrganizationId,
          id,
        );
        setMonitors((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          onUnauthorized();
          return;
        }
        setError(err instanceof Error ? err.message : 'حذف سایت ناموفق بود');
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

    socket.on('monitorUpdated', (updated: Monitor) => {
      setMonitors((prev) => upsertMonitor(prev, updated));
    });

    return () => {
      socket.disconnect();
    };
  }, [session.accessToken, session.activeOrganizationId, refresh]);

  return {
    monitors,
    loading,
    saving,
    error,
    refresh,
    addMonitor,
    removeMonitor,
  };
}
