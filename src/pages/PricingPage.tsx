import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { PlanConfig, PaymentProof } from '@/types/database';
import { Bot, Check, ArrowLeft, Upload, Phone, CreditCard, FileImage, Loader2 } from 'lucide-react';

export function PricingPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('plan_config')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      setPlans((data ?? []) as PlanConfig[]);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: PlanConfig) => {
    if (plan.plan_key === 'free') {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/register');
      }
      return;
    }
    if (!user) {
      showToast('Please sign up first, then select a plan.', 'info');
      navigate('/register');
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, file);
    if (error) {
      showToast('Upload failed: ' + error.message, 'error');
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);
    setScreenshotUrl(urlData.publicUrl);
    setUploading(false);
    showToast('Screenshot uploaded!', 'success');
  };

  const handleSubmitProof = async () => {
    if (!user || !selectedPlan || !screenshotUrl) {
      showToast('Please upload a payment screenshot', 'error');
      return;
    }
    const { error } = await supabase
      .from('payment_proofs')
      .insert({
        user_id: user.id,
        plan_key: selectedPlan.plan_key,
        screenshot_url: screenshotUrl,
        amount_pkr: selectedPlan.price_pkr,
        transaction_id: transactionId || null,
        status: 'pending',
      });
    if (error) {
      showToast('Failed to submit: ' + error.message, 'error');
      return;
    }
    showToast('Payment proof submitted! Admin will review and activate your plan.', 'success');
    setShowPaymentModal(false);
    setScreenshotUrl('');
    setTransactionId('');
    navigate('/subscription');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] bg-grid relative">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-white">BizAgent OS</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Sign In</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Simple, Transparent Pricing</h1>
          <p className="text-slate-400">Choose the plan that fits your business. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isPro = plan.plan_key === 'pro';
            const isBusiness = plan.plan_key === 'business';
            return (
              <div
                key={plan.id}
                className={`glass-card p-8 relative ${isPro ? 'gradient-border border-teal-500/30' : ''}`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs font-medium">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold text-white mb-1">{plan.plan_name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">Rs {plan.price_pkr.toLocaleString()}</span>
                  <span className="text-sm text-slate-400">/month</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={plan.plan_key === 'free' ? 'btn-secondary w-full' : 'btn-primary w-full'}
                >
                  {plan.plan_key === 'free' ? 'Start Free' : `Upgrade to ${plan.plan_name}`}
                </button>

                {plan.plan_key !== 'free' && (
                  <p className="text-xs text-slate-500 text-center mt-3">
                    Pay via JazzCash/EasyPaisa and upload screenshot
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Payment instructions */}
        <div className="glass-card p-6 mt-8 max-w-2xl mx-auto">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <CreditCard size={18} className="text-teal-400" />
            How to Pay for Pro & Business Plans
          </h3>
          <div className="space-y-2 text-sm text-slate-400">
            <p className="flex items-center gap-2"><Phone size={14} className="text-teal-400" /> Send payment to: <span className="text-white font-mono">03008552472</span></p>
            <p className="flex items-center gap-2"><CreditCard size={14} className="text-teal-400" /> Account Title: <span className="text-white font-mono">M H A SHEIKH</span></p>
            <p>3. Take a screenshot of your payment confirmation</p>
            <p>4. Click "Upgrade" on your chosen plan and upload the screenshot</p>
            <p>5. Admin will review and activate your plan within 24 hours</p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative max-w-md w-full glass-card p-6 animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Payment for {selectedPlan.plan_name}</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>

            <div className="glass-card p-4 mb-4 bg-teal-500/5 border-teal-500/15">
              <p className="text-sm text-slate-300 mb-2">Send payment via JazzCash / EasyPaisa:</p>
              <p className="text-sm text-slate-400">Number: <span className="text-white font-mono font-medium">03008552472</span></p>
              <p className="text-sm text-slate-400">Title: <span className="text-white font-mono font-medium">M H A SHEIKH</span></p>
              <p className="text-sm text-slate-400 mt-2">Amount: <span className="text-teal-400 font-bold text-base">Rs {selectedPlan.price_pkr.toLocaleString()}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-text">Transaction ID (optional)</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="input-field"
                  placeholder="Transaction reference number"
                />
              </div>

              <div>
                <label className="label-text">Payment Screenshot</label>
                <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl bg-white/[0.03] border border-dashed border-white/[0.15] cursor-pointer hover:bg-white/[0.05] hover:border-teal-500/30 transition-all">
                  {uploading ? (
                    <>
                      <Loader2 size={24} className="animate-spin text-teal-400" />
                      <span className="text-sm text-slate-400">Uploading...</span>
                    </>
                  ) : screenshotUrl ? (
                    <>
                      <FileImage size={24} className="text-teal-400" />
                      <span className="text-sm text-teal-400">Screenshot uploaded!</span>
                      <img src={screenshotUrl} alt="Payment proof" className="mt-2 max-h-32 rounded-lg" />
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-slate-500" />
                      <span className="text-sm text-slate-400">Click to upload payment screenshot</span>
                      <span className="text-xs text-slate-500">PNG, JPG up to 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              </div>

              <button onClick={handleSubmitProof} disabled={!screenshotUrl} className="btn-primary w-full">
                Submit Payment Proof
              </button>
              <p className="text-xs text-slate-500 text-center">Your plan will be activated after admin review</p>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
        <Link to="/" className="btn-ghost"><ArrowLeft size={16} /> Back to Home</Link>
      </div>
    </div>
  );
}
