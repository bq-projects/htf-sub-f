import { useEffect, useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/ui';
import type { PlanConfig, PaymentProof } from '@/types/database';
import { useRouter } from '@/contexts/RouterContext';
import { CreditCard, Check, Loader2, Clock, XCircle, ArrowRight } from 'lucide-react';

export function SubscriptionPage() {
  const { currentBusiness, subscription, refreshSubscription } = useBusiness();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [plansRes, proofsRes] = await Promise.all([
        supabase.from('plan_config').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('payment_proofs').select('*').order('created_at', { ascending: false }),
      ]);
      setPlans((plansRes.data ?? []) as PlanConfig[]);
      setProofs((proofsRes.data ?? []) as PaymentProof[]);
      setLoading(false);
    };
    fetchData();
  }, [currentBusiness]);

  if (!currentBusiness) {
    return <EmptyState icon={CreditCard} title="No business" description="Create a business first." />;
  }

  const currentPlan = subscription?.plan || 'free';

  const statusBadge = (status: string) => {
    if (status === 'approved') return <span className="badge-green"><Check size={12} /> Approved</span>;
    if (status === 'pending') return <span className="badge-amber"><Clock size={12} /> Pending Review</span>;
    if (status === 'rejected') return <span className="badge-red"><XCircle size={12} /> Rejected</span>;
    return <span className="badge-blue">{status}</span>;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Subscription"
        subtitle={currentBusiness.name}
        icon={CreditCard}
        action={<button onClick={() => navigate('/pricing')} className="btn-primary">Upgrade Plan <ArrowRight size={16} /></button>}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-teal-400" /></div>
      ) : (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="glass-card p-6 gradient-border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Current Plan</p>
                <h2 className="text-2xl font-bold text-white capitalize">{currentPlan}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Status: <span className="text-emerald-400">{subscription?.status || 'active'}</span>
                </p>
              </div>
              <div className="text-right">
                {plans.find(p => p.plan_key === currentPlan) && (
                  <>
                    <p className="text-3xl font-bold text-white">Rs {plans.find(p => p.plan_key === currentPlan)!.price_pkr.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">per month</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="glass-card p-6">
            <h3 className="text-white font-medium mb-4">Payment History</h3>
            {proofs.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard size={28} className="text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No payment submissions yet</p>
                <button onClick={() => navigate('/pricing')} className="btn-secondary mt-3">View Plans</button>
              </div>
            ) : (
              <div className="space-y-3">
                {proofs.map((proof) => (
                  <div key={proof.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.08] overflow-hidden">
                        <img src={proof.screenshot_url} alt="Payment" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{proof.plan_key} Plan</p>
                        <p className="text-xs text-slate-500">
                          Rs {proof.amount_pkr?.toLocaleString() || '—'}
                          {proof.transaction_id && ` • TXN: ${proof.transaction_id}`}
                        </p>
                        <p className="text-xs text-slate-500">{new Date(proof.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {statusBadge(proof.status)}
                      {proof.admin_notes && (
                        <span className="text-xs text-slate-400 max-w-xs">{proof.admin_notes}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Plans */}
          <div>
            <h3 className="text-white font-medium mb-4">Available Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className={`glass-card p-5 ${plan.plan_key === currentPlan ? 'border-teal-500/30 gradient-border' : ''}`}>
                  <h4 className="text-white font-medium">{plan.plan_name}</h4>
                  <p className="text-2xl font-bold text-white mt-1">Rs {plan.price_pkr.toLocaleString()}<span className="text-xs text-slate-500 font-normal">/mo</span></p>
                  <ul className="space-y-1.5 mt-3">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <Check size={12} className="text-teal-400 mt-0.5 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {plan.plan_key === currentPlan ? (
                    <p className="text-xs text-teal-400 text-center mt-3 font-medium">Current Plan</p>
                  ) : (
                    <button onClick={() => navigate('/pricing')} className="btn-secondary w-full mt-3 text-xs">Switch</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
