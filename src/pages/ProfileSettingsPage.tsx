import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui';
import { User, Save, Loader2 } from 'lucide-react';

export function ProfileSettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Profile updated!', 'success');
      refreshProfile();
    }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account"
        icon={User}
        action={<button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save</button>}
      />

      <div className="glass-card p-6 space-y-4 max-w-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-teal-300">
              {(fullName || user?.email || 'U')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white font-medium">{fullName || 'User'}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div>
          <label className="label-text">Full Name</label>
          <input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
        </div>

        <div>
          <label className="label-text">Email (read-only)</label>
          <input className="input-field opacity-50 cursor-not-allowed" value={user?.email || ''} disabled />
        </div>
      </div>
    </div>
  );
}
