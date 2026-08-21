import { useState, type FormEvent } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { ui } from '../../styles/ui';
import type { OrganizationMember } from '../../api/organizationsApi';

type OrganizationsSectionProps = {
  isOwner: boolean;
  members: OrganizationMember[];
  saving: boolean;
  error: string;
  notice: string;
  onCreateOrg: (name: string) => Promise<boolean>;
  onInvite: (email: string) => Promise<boolean>;
  onRemove: (userId: string) => Promise<void>;
};

export function OrganizationsSection({
  isOwner,
  members,
  saving,
  error,
  notice,
  onCreateOrg,
  onInvite,
  onRemove,
}: OrganizationsSectionProps) {
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');

  const submitOrg = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await onCreateOrg(orgName.trim());
    if (ok) {
      setOrgName('');
    }
  };

  const submitInvite = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await onInvite(email.trim());
    if (ok) {
      setEmail('');
    }
  };

  return (
    <section style={ui.chartSection}>
      <h2 style={{ ...ui.sectionTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Users size={18} color="var(--primary)" /> سازمان و اعضا
      </h2>
      <p style={ui.sectionSubtitle}>
        داده‌های پایش بین اعضای یک سازمان مشترک است. کلید ایجنت متعلق به سازمان فعال است.
      </p>

      <form onSubmit={(event) => void submitOrg(event)} style={ui.monitorForm}>
        <label style={ui.monitorLabel}>
          سازمان جدید
          <input
            value={orgName}
            onChange={(event) => setOrgName(event.target.value)}
            placeholder="تیم عملیات"
            style={ui.monitorInput}
            required
            minLength={2}
            maxLength={80}
          />
        </label>
        <button type="submit" disabled={saving} style={ui.monitorSubmit}>
          <Plus size={16} />
          ایجاد سازمان
        </button>
      </form>

      {isOwner ? (
        <form onSubmit={(event) => void submitInvite(event)} style={{ ...ui.monitorForm, marginTop: '12px' }}>
          <label style={ui.monitorLabel}>
            دعوت عضو (ایمیل ثبت‌شده)
            <input
              dir="ltr"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="colleague@example.com"
              style={ui.monitorInput}
            />
          </label>
          <button type="submit" disabled={saving} style={ui.monitorSubmit}>
            دعوت به سازمان
          </button>
        </form>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '14px 0 0' }}>
          فقط مالک سازمان می‌تواند عضو جدید دعوت کند.
        </p>
      )}

      {notice ? <p style={{ color: '#10b981', fontSize: '13px', margin: '12px 0 0' }}>{notice}</p> : null}
      {error ? <p style={{ color: '#ef4444', fontSize: '13px', margin: '12px 0 0' }}>{error}</p> : null}

      <div style={ui.monitorList}>
        {members.map((member) => (
          <div key={member.id} style={ui.monitorRow}>
            <div>
              <strong style={{ direction: 'ltr', display: 'inline-block' }}>{member.email}</strong>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                {member.role === 'OWNER' ? 'مالک' : 'عضو'}
              </p>
            </div>
            {isOwner && member.role !== 'OWNER' ? (
              <button
                type="button"
                onClick={() => void onRemove(member.userId)}
                style={ui.monitorDelete}
                title="حذف عضو"
              >
                <Trash2 size={15} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
