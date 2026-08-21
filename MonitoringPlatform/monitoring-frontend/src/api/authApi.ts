import {
  saveSession,
  type OrganizationSummary,
  type Session,
} from '../auth/session';
import { requestJson } from './http';

type AuthResponse = {
  accessToken: string;
  user: Session['user'];
  organizations: OrganizationSummary[];
  activeOrganizationId: string;
};

function toSession(body: AuthResponse): Session {
  const active =
    body.organizations.find((org) => org.id === body.activeOrganizationId) ??
    body.organizations[0];
  return {
    accessToken: body.accessToken,
    user: {
      ...body.user,
      apiKey: active?.apiKey ?? body.user.apiKey,
    },
    organizations: body.organizations,
    activeOrganizationId: active?.id ?? body.activeOrganizationId,
  };
}

export async function login(email: string, password: string): Promise<Session> {
  const body = await requestJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const session = toSession(body);
  saveSession(session);
  return session;
}

export async function register(email: string, password: string): Promise<Session> {
  const body = await requestJson<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const session = toSession(body);
  saveSession(session);
  return session;
}
