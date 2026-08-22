import { useCallback, useEffect, useState } from 'react';
import { UnauthorizedError } from '../api/http';
import {
  fetchAlertThresholds,
  saveAlertThresholds,
} from '../api/organizationsApi';
import type { Session } from '../auth/session';
import type { AlertThresholds } from '../types/monitoring';

type AlertThresholdFeed = {
  thresholds: AlertThresholds | null;
  saving: boolean;
  error: string;
  notice: string;
  save: (values: Pick<
    AlertThresholds,
    'cpuThreshold' | 'ramThreshold' | 'diskThreshold'
  >) => Promise<boolean>;
  refresh: () => Promise<void>;
};

export function useAlertThresholds(
  session: Session,
  onUnauthorized: () => void,
): AlertThresholdFeed {
  const [thresholds, setThresholds] = useState<AlertThresholds | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    try {
      setThresholds(
        await fetchAlertThresholds(
          session.accessToken,
          session.activeOrganizationId,
        ),
      );
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }
      console.error('Error fetching alert thresholds:', err);
    }
  }, [session.accessToken, session.activeOrganizationId, onUnauthorized]);

  const save = useCallback(
    async (
      values: Pick<
        AlertThresholds,
        'cpuThreshold' | 'ramThreshold' | 'diskThreshold'
      >,
    ): Promise<boolean> => {
      setError('');
      setNotice('');
      setSaving(true);
      try {
        const next = await saveAlertThresholds(
          session.accessToken,
          session.activeOrganizationId,
          values,
        );
        setThresholds(next);
        setNotice('آستانه‌های هشدار ذخیره شد');
        return true;
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          onUnauthorized();
          return false;
        }
        setError(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [session.accessToken, session.activeOrganizationId, onUnauthorized],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { thresholds, saving, error, notice, save, refresh };
}
