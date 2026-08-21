import type { OrganizationSummary } from '../auth/session';
import { requestJson } from './http';

export type OrganizationMember = {
  id: string;
  userId: string;
  email: string;
  role: 'OWNER' | 'MEMBER';
  createdAt: string;
};

export async function fetchOrganizations(
  token: string,
  organizationId: string,
): Promise<OrganizationSummary[]> {
  return await requestJson<OrganizationSummary[]>('/organizations', {
    token,
    organizationId,
  });
}

export async function createOrganization(
  token: string,
  organizationId: string,
  name: string,
): Promise<OrganizationSummary> {
  return await requestJson<OrganizationSummary>('/organizations', {
    token,
    organizationId,
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function fetchMembers(
  token: string,
  organizationId: string,
): Promise<OrganizationMember[]> {
  return await requestJson<OrganizationMember[]>(
    `/organizations/${organizationId}/members`,
    { token, organizationId },
  );
}

export async function inviteMember(
  token: string,
  organizationId: string,
  email: string,
): Promise<OrganizationMember> {
  return await requestJson<OrganizationMember>(
    `/organizations/${organizationId}/members`,
    {
      token,
      organizationId,
      method: 'POST',
      body: JSON.stringify({ email }),
    },
  );
}

export async function removeMember(
  token: string,
  organizationId: string,
  userId: string,
): Promise<void> {
  await requestJson<{ status: string }>(
    `/organizations/${organizationId}/members/${userId}`,
    {
      token,
      organizationId,
      method: 'DELETE',
    },
  );
}
