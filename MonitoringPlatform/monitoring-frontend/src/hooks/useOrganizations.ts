import { useCallback, useEffect, useState } from 'react';
import { UnauthorizedError } from '../api/http';
import {
  createOrganization,
  fetchMembers,
  fetchOrganizations,
  inviteMember,
  removeMember,
  type OrganizationMember,
} from '../api/organizationsApi';
import {
  saveSession,
  type OrganizationSummary,
  type Session,
} from '../auth/session';

type OrganizationsFeed = {
  members: OrganizationMember[];
  saving: boolean;
  error: string;
  notice: string;
  refreshMembers: () => Promise<void>;
  createOrg: (name: string) => Promise<boolean>;
  invite: (email: string) => Promise<boolean>;
  remove: (userId: string) => Promise<void>;
};

export function useOrganizations(
  session: Session,
  onSessionChange: (session: Session) => void,
  onUnauthorized: () => void,
): OrganizationsFeed {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshMembers = useCallback(async () => {
    try {
      const next = await fetchMembers(
        session.accessToken,
        session.activeOrganizationId,
      );
      setMembers(next);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }
      console.error('Error fetching members:', err);
    }
  }, [session.accessToken, session.activeOrganizationId, onUnauthorized]);

  const createOrg = useCallback(
    async (name: string): Promise<boolean> => {
      setError('');
      setNotice('');
      setSaving(true);
      try {
        const created = await createOrganization(
          session.accessToken,
          session.activeOrganizationId,
          name,
        );
        const organizations = await fetchOrganizations(
          session.accessToken,
          session.activeOrganizationId,
        );
        const next: Session = {
          ...session,
          organizations,
          activeOrganizationId: created.id,
          user: { ...session.user, apiKey: created.apiKey },
        };
        saveSession(next);
        onSessionChange(next);
        setNotice('سازمان جدید ساخته شد');
        return true;
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          onUnauthorized();
          return false;
        }
        setError(err instanceof Error ? err.message : 'ایجاد سازمان ناموفق بود');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [session, onSessionChange, onUnauthorized],
  );

  const invite = useCallback(
    async (email: string): Promise<boolean> => {
      setError('');
      setNotice('');
      setSaving(true);
      try {
        const member = await inviteMember(
          session.accessToken,
          session.activeOrganizationId,
          email,
        );
        setMembers((prev) => [...prev, member]);
        setNotice('عضو جدید اضافه شد');
        return true;
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          onUnauthorized();
          return false;
        }
        setError(err instanceof Error ? err.message : 'دعوت ناموفق بود');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [session.accessToken, session.activeOrganizationId, onUnauthorized],
  );

  const remove = useCallback(
    async (userId: string) => {
      setError('');
      try {
        await removeMember(
          session.accessToken,
          session.activeOrganizationId,
          userId,
        );
        setMembers((prev) => prev.filter((member) => member.userId !== userId));
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          onUnauthorized();
          return;
        }
        setError(err instanceof Error ? err.message : 'حذف عضو ناموفق بود');
      }
    },
    [session.accessToken, session.activeOrganizationId, onUnauthorized],
  );

  useEffect(() => {
    void refreshMembers();
  }, [refreshMembers]);

  return {
    members,
    saving,
    error,
    notice,
    refreshMembers,
    createOrg,
    invite,
    remove,
  };
}

export type { OrganizationSummary };
