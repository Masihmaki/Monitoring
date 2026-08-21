import { OrganizationRole } from './organization-role';

describe('OrganizationRole', () => {
  it('exposes owner and member roles used by invite rules', () => {
    expect(OrganizationRole.OWNER).toBe('OWNER');
    expect(OrganizationRole.MEMBER).toBe('MEMBER');
  });
});
