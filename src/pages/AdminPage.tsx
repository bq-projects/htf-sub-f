import { useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import {
  Shield, LogOut, Users, CreditCard, DollarSign, Check, X,
  Clock, Loader2, Building2, Settings, Save, TrendingUp
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AdminData { loggedIn: boolean; email: string; role: string; }
interface PaymentProofRow {
  id: string; user_id: string; business_id: string | null;
  plan_key: string; screenshot_url: string; amount_pkr: number | null;
  transaction_id: string | null; status: string; admin_notes: string | null; created_at: string;
}
interface BusinessRow {
  id: string; name: string; industry: string | null; owner_id: string;
  onboarding_complete: boolean; created_at: string;
  profiles: { full_name: string | null } | null;
  subscriptions: { plan: string; status: string } | null;
}
interface PlanRow {
  id: string; plan_key: string; plan_name: string; price_pkr: number;
  price_usd: number; max_businesses: number; max_knowledge_files: number;
  max_generations: number; features: string[]; is_active: boolean; sort_order: number;
}
interface Stats {
  totalBusinesses: number; totalUsers: number; pendingPayments: number;
  approvedPayments: number; totalRevenue: number;
}

type Tab = 'overview' | 'payments' | 'businesses' | 'plans';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`;
const API_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

export function AdminPage() {
  const { showToast } = useToast();
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [proofs, setProofs] = useState<PaymentProofRow[]>([]);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBusinesses: 0, totalUsers: 0, pendingPayments: 0,
    approvedPayments: 0, totalRevenue: 0,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_session');
    if (stored) {
      try { setAdmin(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const data = await response.json();
      if (!response.ok || !data.authenticated) {
        throw new Error(data.error || 'Invalid credentials');
      }
      const adminData = { loggedIn: true, email: data.email, role: data.role };
      sessionStorage.setItem('admin_session', JSON.stringify(adminData));
      setAdmin(adminData);
      showToast('Welcome, Admin!', 'success');
      loadData();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    }
    setLoggingIn(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session');
    setAdmin(null);
    setLoginForm({ email: '', password: '' });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, { headers: API_HEADERS });
      if (response.ok) {
        const data = await response.json();
        setProofs(data.proofs ?? []);
        setBusinesses(data.businesses ?? []);
        setPlans(data.plans ?? []);
        setStats(data.stats ?? { totalBusinesses: 0, totalUsers: 0, pendingPayments: 0, approvedPayments: 0, totalRevenue: 0 });
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { if (admin?.loggedIn) loadData(); }, [admin?.loggedIn]);

  const apiAction = async (body: Record<string, unknown>) => {
    const response = await fetch(`${API_URL}?action=${body.action}`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Action failed');
    return data;
  };

  const handleApprovePayment = async (proof: PaymentProofRow) => {
    if (!proof.business_id) { showToast('Cannot approve: no business linked', 'error'); return; }
    setLoading(true);
    try {
      await apiAction({ action: 'approve', proofId: proof.id, businessId: proof.business_id, planKey: proof.plan_key });
      showToast(`${proof.plan_key} plan approved!`, 'success');
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
    setLoading(false);
  };

  const handleRejectPayment = async (proof: PaymentProofRow) => {
    const notes = prompt('Reason for rejection:') || '';
    setLoading(true);
    try {
      await apiAction({ action: 'reject', proofId: proof.id, notes });
      showToast('Payment rejected', 'info');
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
    setLoading(false);
  };

  const handleSavePlan = async (plan: PlanRow) => {
    setLoading(true);
    try {
      await apiAction({
        action: 'save_plan',
        id: plan.id, plan_name: plan.plan_name, price_pkr: plan.price_pkr,
        price_usd: plan.price_usd, max_businesses: plan.max_businesses,
        max_knowledge_files: plan.max_knowledge_files, max_generations: plan.max_generations,
        features: plan.features, is_active: plan.is_active,
      });
      showToast(`${plan.plan_name} updated!`, 'success');
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
    setLoading(false);
  };

  // Login screen
  if (!admin?.loggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] bg-grid relative flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
        <div className="relative w-full max-w-md">
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
              <p className="text-sm text-slate-400 mt-1">BizAgent OS Administration</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label-text">Admin Email</label>
                <input type="email" required className="input-field" value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="owner@haqgroup.site" />
              </div>
              <div>
                <label className="label-text">Password</label>
                <input type="password" required className="input-field" value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter admin password" />
              </div>
              {loginError && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                  {loginError}
                </div>
              )}
              <button type="submit" disabled={loggingIn} className="btn-primary w-full py-3">
                {loggingIn ? 'Authenticating...' : 'Sign In to Admin'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'payments', label: 'Payment Approvals', icon: CreditCard },
    { key: 'businesses', label: 'Businesses', icon: Building2 },
    { key: 'plans', label: 'Pricing Plans', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <div className="sticky top-0 z-20 bg-[#0f1420]/80 backdrop-blur-xl border-b border-white/[0.06] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <span className="text-base font-semibold text-white">BizAgent OS Admin</span>
            <span className="text-xs text-slate-500 ml-2">{admin.email}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost text-red-400 hover:text-red-300">
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={tab === t.key ? 'sidebar-link-active' : 'sidebar-link'}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-teal-400" /></div>
        )}

        {tab === 'overview' && !loading && (
          <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Total Businesses" value={stats.totalBusinesses} icon={Building2} color="teal" />
              <StatBox label="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
              <StatBox label="Pending Payments" value={stats.pendingPayments} icon={Clock} color="amber" />
              <StatBox label="Total Revenue" value={`Rs ${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="green" />
            </div>
            <div className="glass-card p-6">
              <h3 className="text-white font-medium mb-4">Recent Payment Submissions</h3>
              {proofs.length === 0 ? (
                <p className="text-sm text-slate-500">No payment submissions yet</p>
              ) : (
                <div className="space-y-2">
                  {proofs.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                          <img src={p.screenshot_url} alt="Proof" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm text-white capitalize">{p.plan_key} Plan</p>
                          <p className="text-xs text-slate-500">Rs {p.amount_pkr?.toLocaleString() || '—'} • {new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={p.status === 'pending' ? 'badge-amber' : p.status === 'approved' ? 'badge-green' : 'badge-red'}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'payments' && !loading && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-white mb-4">Payment Approvals</h2>
            {proofs.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <CreditCard size={28} className="text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No payment submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {proofs.map(p => (
                  <div key={p.id} className="glass-card p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                          <img src={p.screenshot_url} alt="Payment Proof" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-white font-medium capitalize">{p.plan_key} Plan</p>
                          <p className="text-sm text-slate-400">Amount: Rs {p.amount_pkr?.toLocaleString() || '—'}</p>
                          {p.transaction_id && <p className="text-xs text-slate-500">TXN: {p.transaction_id}</p>}
                          <p className="text-xs text-slate-500">{new Date(p.created_at).toLocaleString()}</p>
                          {p.admin_notes && <p className="text-xs text-amber-400 mt-1">Admin notes: {p.admin_notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.status === 'pending' ? (
                          <>
                            <button onClick={() => handleApprovePayment(p)} disabled={loading} className="btn-primary text-xs">
                              <Check size={14} /> Approve
                            </button>
                            <button onClick={() => handleRejectPayment(p)} disabled={loading} className="btn-secondary text-xs">
                              <X size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <span className={p.status === 'approved' ? 'badge-green' : 'badge-red'}>
                            {p.status === 'approved' ? <Check size={12} /> : <X size={12} />} {p.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'businesses' && !loading && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-white mb-4">Registered Businesses</h2>
            {businesses.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Building2 size={28} className="text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No businesses registered yet</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-slate-400 text-xs uppercase">
                      <th className="text-left px-4 py-3">Business</th>
                      <th className="text-left px-4 py-3">Owner</th>
                      <th className="text-left px-4 py-3">Plan</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map(b => (
                      <tr key={b.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{b.name}</p>
                          <p className="text-xs text-slate-500">{b.industry || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{b.profiles?.full_name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="badge-blue capitalize">{b.subscriptions?.plan || 'free'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {b.onboarding_complete ? <span className="badge-green">Complete</span> : <span className="badge-amber">Pending</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{new Date(b.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'plans' && !loading && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-white mb-4">Pricing Plan Configuration</h2>
            <div className="space-y-4">
              {plans.map(plan => (
                <PlanEditor key={plan.id} plan={plan} onSave={handleSavePlan} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: LucideIcon;
  color: 'teal' | 'blue' | 'amber' | 'green';
}) {
  const colors = {
    teal: 'from-teal-500/20 to-cyan-500/5 border-teal-500/20 text-teal-400',
    blue: 'from-blue-500/20 to-indigo-500/5 border-blue-500/20 text-blue-400',
    amber: 'from-amber-500/20 to-orange-500/5 border-amber-500/20 text-amber-400',
    green: 'from-emerald-500/20 to-green-500/5 border-emerald-500/20 text-emerald-400',
  };
  return (
    <div className="glass-card p-5">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br border flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function PlanEditor({ plan, onSave }: { plan: PlanRow; onSave: (p: PlanRow) => void }) {
  const [edit, setEdit] = useState(plan);
  const [featuresText, setFeaturesText] = useState(plan.features.join('\n'));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEdit(plan);
    setFeaturesText(plan.features.join('\n'));
  }, [plan]);

  const handleSave = () => {
    const features = featuresText.split('\n').filter(f => f.trim());
    onSave({ ...edit, features });
    setEditing(false);
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium capitalize">{plan.plan_key}</span>
          <span className={plan.is_active ? 'badge-green' : 'badge-red'}>
            {plan.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        {editing ? (
          <button onClick={handleSave} className="btn-primary text-xs"><Save size={14} /> Save</button>
        ) : (
          <button onClick={() => setEditing(true)} className="btn-secondary text-xs"><Settings size={14} /> Edit</button>
        )}
      </div>
      {editing ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className="label-text">Plan Name</label><input className="input-field" value={edit.plan_name} onChange={(e) => setEdit(prev => ({ ...prev, plan_name: e.target.value }))} /></div>
          <div><label className="label-text">Price (PKR)</label><input type="number" className="input-field" value={edit.price_pkr} onChange={(e) => setEdit(prev => ({ ...prev, price_pkr: parseInt(e.target.value) || 0 }))} /></div>
          <div><label className="label-text">Price (USD)</label><input type="number" className="input-field" value={edit.price_usd} onChange={(e) => setEdit(prev => ({ ...prev, price_usd: parseFloat(e.target.value) || 0 }))} /></div>
          <div><label className="label-text">Max Businesses</label><input type="number" className="input-field" value={edit.max_businesses} onChange={(e) => setEdit(prev => ({ ...prev, max_businesses: parseInt(e.target.value) || 1 }))} /></div>
          <div><label className="label-text">Max Files</label><input type="number" className="input-field" value={edit.max_knowledge_files} onChange={(e) => setEdit(prev => ({ ...prev, max_knowledge_files: parseInt(e.target.value) || 3 }))} /></div>
          <div><label className="label-text">Max Generations</label><input type="number" className="input-field" value={edit.max_generations} onChange={(e) => setEdit(prev => ({ ...prev, max_generations: parseInt(e.target.value) || 20 }))} /></div>
          <div className="col-span-full"><label className="label-text">Features (one per line)</label><textarea className="input-field min-h-[120px]" value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} /></div>
          <label className="flex items-center gap-2 col-span-full">
            <input type="checkbox" checked={edit.is_active} onChange={(e) => setEdit(prev => ({ ...prev, is_active: e.target.checked }))} />
            <span className="text-sm text-slate-300">Active (visible on pricing page)</span>
          </label>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="flex gap-4 text-slate-400 flex-wrap">
            <span>Price: <span className="text-white">Rs {plan.price_pkr.toLocaleString()}</span></span>
            <span>Businesses: <span className="text-white">{plan.max_businesses}</span></span>
            <span>Files: <span className="text-white">{plan.max_knowledge_files}</span></span>
            <span>Generations: <span className="text-white">{plan.max_generations}</span></span>
          </div>
          <ul className="space-y-1">
            {plan.features.map((f, i) => (
              <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                <Check size={12} className="text-teal-400 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
