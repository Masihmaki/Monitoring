import { useCallback, useEffect, useMemo, useState } from 'react';
import { UnauthorizedError } from '../api/http';
import { fetchHosts } from '../api/monitoringApi';
import type { Session } from '../auth/session';

const hostKey = (organizationId: string) =>
  `monitoring.selectedHost.${organizationId}`;

type SelectedHostFeed = {
  hosts: string[];
  selectedHost: string | null;
  setSelectedHost: (host: string | null) => void;
};

export function useSelectedHost(
  session: Session,
  onUnauthorized: () => void,
): SelectedHostFeed {
  const [knownHosts, setKnownHosts] = useState<string[]>([]);
  const [selectedHost, setSelectedHostState] = useState<string | null>(() =>
    localStorage.getItem(hostKey(session.activeOrganizationId)),
  );

  const hosts = useMemo(
    () => [...knownHosts].sort((a, b) => a.localeCompare(b, 'en')),
    [knownHosts],
  );

  const setSelectedHost = useCallback(
    (host: string | null) => {
      setSelectedHostState(host);
      const key = hostKey(session.activeOrganizationId);
      if (host) {
        localStorage.setItem(key, host);
      } else {
        localStorage.removeItem(key);
      }
    },
    [session.activeOrganizationId],
  );

  useEffect(() => {
    const saved = localStorage.getItem(hostKey(session.activeOrganizationId));
    setSelectedHostState(saved);
  }, [session.activeOrganizationId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await fetchHosts(
          session.accessToken,
          session.activeOrganizationId,
        );
        if (!cancelled) {
          setKnownHosts(next);
        }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          onUnauthorized();
          return;
        }
        console.error('Error fetching hosts:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session.accessToken, session.activeOrganizationId, onUnauthorized]);

  useEffect(() => {
    if (selectedHost && hosts.length > 0 && !hosts.includes(selectedHost)) {
      setSelectedHost(hosts[0] ?? null);
      return;
    }
    if (!selectedHost && hosts.length > 0) {
      setSelectedHost(hosts[0]);
    }
  }, [hosts, selectedHost, setSelectedHost]);

  return { hosts, selectedHost, setSelectedHost };
}
