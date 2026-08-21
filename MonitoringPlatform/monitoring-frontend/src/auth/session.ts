const TOKEN_KEY = 'monitoring.accessToken';
const USER_KEY = 'monitoring.user';
const ORGS_KEY = 'monitoring.organizations';
const ACTIVE_ORG_KEY = 'monitoring.activeOrganizationId';

export type SessionUser = {
  id: string;
  email: string;
  apiKey: string;
};

export type OrganizationSummary = {
  id: string;
  name: string;
  role: 'OWNER' | 'MEMBER';
  apiKey: string;
  createdAt: string;
};

export type Session = {
  accessToken: string;
  user: SessionUser;
  organizations: OrganizationSummary[];
  activeOrganizationId: string;
};

export function loadSession(): Session | null {
  try {
    const accessToken = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    const rawOrgs = localStorage.getItem(ORGS_KEY);
    const activeOrganizationId = localStorage.getItem(ACTIVE_ORG_KEY);
    if (!accessToken || !rawUser || !rawOrgs || !activeOrganizationId) {
      return null;
    }
    const organizations = JSON.parse(rawOrgs) as OrganizationSummary[];
    const user = JSON.parse(rawUser) as SessionUser;
    const active = organizations.find((org) => org.id === activeOrganizationId);
    if (!active) {
      return null;
    }
    return {
      accessToken,
      user: { ...user, apiKey: active.apiKey },
      organizations,
      activeOrganizationId,
    };
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(TOKEN_KEY, session.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  localStorage.setItem(ORGS_KEY, JSON.stringify(session.organizations));
  localStorage.setItem(ACTIVE_ORG_KEY, session.activeOrganizationId);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ORGS_KEY);
  localStorage.removeItem(ACTIVE_ORG_KEY);
}

export function switchActiveOrganization(
  session: Session,
  organizationId: string,
): Session {
  const active = session.organizations.find((org) => org.id === organizationId);
  if (!active) {
    return session;
  }
  const next: Session = {
    ...session,
    activeOrganizationId: organizationId,
    user: { ...session.user, apiKey: active.apiKey },
  };
  saveSession(next);
  return next;
}
