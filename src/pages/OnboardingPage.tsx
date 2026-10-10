import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { PlanConfig } from '@/types/database';
import {
  Building2, Globe, Palette, Target, Check, ChevronRight, ChevronLeft,
  Sparkles, BookOpen, Cpu, Loader2
} from 'lucide-react';

const industries = [
  'E-commerce', 'Retail', 'Restaurant', 'Technology', 'Healthcare',
  'Education', 'Real Estate', 'Finance', 'Manufacturing', 'Services',
  'Marketing', 'Consulting', 'Fitness', 'Beauty', 'Other'
];

const tones = ['Professional', 'Friendly', 'Casual', 'Formal', 'Playful', 'Luxury'];
const languages = ['English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German'];

export function OnboardingPage() {
  const { user } = useAuth();
  const { refreshBusinesses } = useBusiness();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<PlanConfig[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    industry: 'E-commerce',
    description: '',
    website: '',
    contact_email: user?.email || '',
    phone: '',
    country: 'Pakistan',
    address: '',
    products_services: '',
    target_audience: '',
    preferred_language: 'English',
    brand_tone: 'Professional',
    business_goals: '',
    primary_color: '#14b8a6',
    secondary_color: '#0ea5e9',
    facebook: '',
    instagram: '',
    linkedin: '',
  });

  const update = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('plan_config')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    setPlans((data ?? []) as PlanConfig[]);
  };

  const handleCreateBusiness = async (planKey: string) => {
    if (!user) return;
    setLoading(true);

    const socialLinks: Record<string, string> = {};
    if (formData.facebook) socialLinks.facebook = formData.facebook;
    if (formData.instagram) socialLinks.instagram = formData.instagram;
    if (formData.linkedin) socialLinks.linkedin = formData.linkedin;

    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .insert({
        owner_id: user.id,
        name: formData.name,
        industry: formData.industry,
        description: formData.description,
        website: formData.website,
        contact_email: formData.contact_email,
        phone: formData.phone,
        country: formData.country,
        address: formData.address,
        products_services: formData.products_services,
        target_audience: formData.target_audience,
        preferred_language: formData.preferred_language,
        brand_tone: formData.brand_tone,
        business_goals: formData.business_goals,
        brand_colors: { primary: formData.primary_color, secondary: formData.secondary_color },
        social_links: socialLinks,
        onboarding_complete: true,
        onboarding_step: 5,
      })
      .select()
      .single();

    if (bizError) {
      showToast(bizError.message, 'error');
      setLoading(false);
      return;
    }

    const businessId = business.id;

    await supabase.from('business_members').insert({
      business_id: businessId,
      user_id: user.id,
      role: 'owner',
    });

    await supabase.from('subscriptions').insert({
      business_id: businessId,
      plan: planKey,
      status: planKey === 'free' ? 'active' : 'pending',
    });

    await supabase.from('agents').insert({
      business_id: businessId,
      name: `${formData.name} Assistant`,
      description: `AI agent for ${formData.name}`,
      preferred_language: formData.preferred_language,
      response_style: 'professional',
      tone: formData.brand_tone,
      instructions: `You are the AI business agent for ${formData.name}. ${formData.description}`,
      status: 'active',
    });

    await refreshBusinesses();
    showToast('Business created successfully!', 'success');
    setLoading(false);
    navigate('/dashboard');
  };

  const steps = [
    { num: 1, label: 'Business Info', icon: Building2 },
    { num: 2, label: 'Products', icon: Target },
    { num: 3, label: 'Brand', icon: Palette },
    { num: 4, label: 'Plan', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] bg-grid relative">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Business Onboarding</span>
          </div>
          <span className="text-sm text-slate-400">Step {step} of 4</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-teal-400' : 'text-slate-600'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${step >= s.num ? 'bg-teal-500/15 border-teal-500/30' : 'bg-white/[0.02] border-white/[0.08]'}`}>
                  {step > s.num ? <Check size={16} /> : <s.icon size={16} />}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 mx-2 ${step > s.num ? 'bg-teal-500/30' : 'bg-white/[0.08]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div className="glass-card p-6 space-y-4 animate-slide-up">
            <h2 className="text-xl font-semibold text-white mb-4">Tell us about your business</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label-text">Business Name *</label>
                <input className="input-field" value={formData.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. NovaTech Store" />
              </div>
              <div>
                <label className="label-text">Industry</label>
                <select className="input-field" value={formData.industry} onChange={(e) => update('industry', e.target.value)}>
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Country</label>
                <input className="input-field" value={formData.country} onChange={(e) => update('country', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label-text">Business Description</label>
                <textarea className="input-field min-h-[80px]" value={formData.description} onChange={(e) => update('description', e.target.value)} placeholder="What does your business do?" />
              </div>
              <div>
                <label className="label-text">Website</label>
                <input className="input-field" value={formData.website} onChange={(e) => update('website', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="label-text">Contact Email</label>
                <input className="input-field" value={formData.contact_email} onChange={(e) => update('contact_email', e.target.value)} />
              </div>
              <div>
                <label className="label-text">Phone</label>
                <input className="input-field" value={formData.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+92..." />
              </div>
              <div>
                <label className="label-text">Address</label>
                <input className="input-field" value={formData.address} onChange={(e) => update('address', e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStep(2)} disabled={!formData.name} className="btn-primary">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Products & Audience */}
        {step === 2 && (
          <div className="glass-card p-6 space-y-4 animate-slide-up">
            <h2 className="text-xl font-semibold text-white mb-4">Products & Target Audience</h2>
            <div>
              <label className="label-text">Products & Services</label>
              <textarea className="input-field min-h-[100px]" value={formData.products_services} onChange={(e) => update('products_services', e.target.value)} placeholder="List your key products and services..." />
            </div>
            <div>
              <label className="label-text">Target Audience</label>
              <textarea className="input-field min-h-[80px]" value={formData.target_audience} onChange={(e) => update('target_audience', e.target.value)} placeholder="Who are your customers?" />
            </div>
            <div>
              <label className="label-text">Business Goals</label>
              <textarea className="input-field min-h-[80px]" value={formData.business_goals} onChange={(e) => update('business_goals', e.target.value)} placeholder="What are your business goals?" />
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary"><ChevronLeft size={16} /> Back</button>
              <button onClick={() => setStep(3)} className="btn-primary">Next <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 3: Brand */}
        {step === 3 && (
          <div className="glass-card p-6 space-y-4 animate-slide-up">
            <h2 className="text-xl font-semibold text-white mb-4">Brand Identity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Preferred Language</label>
                <select className="input-field" value={formData.preferred_language} onChange={(e) => update('preferred_language', e.target.value)}>
                  {languages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Brand Tone</label>
                <select className="input-field" value={formData.brand_tone} onChange={(e) => update('brand_tone', e.target.value)}>
                  {tones.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" className="w-12 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer" value={formData.primary_color} onChange={(e) => update('primary_color', e.target.value)} />
                  <input className="input-field flex-1" value={formData.primary_color} onChange={(e) => update('primary_color', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label-text">Secondary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" className="w-12 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer" value={formData.secondary_color} onChange={(e) => update('secondary_color', e.target.value)} />
                  <input className="input-field flex-1" value={formData.secondary_color} onChange={(e) => update('secondary_color', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label-text">Facebook</label>
                <input className="input-field" value={formData.facebook} onChange={(e) => update('facebook', e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div>
                <label className="label-text">Instagram</label>
                <input className="input-field" value={formData.instagram} onChange={(e) => update('instagram', e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div className="sm:col-span-2">
                <label className="label-text">LinkedIn</label>
                <input className="input-field" value={formData.linkedin} onChange={(e) => update('linkedin', e.target.value)} placeholder="https://linkedin.com/..." />
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary"><ChevronLeft size={16} /> Back</button>
              <button onClick={() => { fetchPlans(); setStep(4); }} className="btn-primary">Next <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 4: Plan Selection */}
        {step === 4 && (
          <div className="glass-card p-6 space-y-4 animate-slide-up">
            <h2 className="text-xl font-semibold text-white mb-4">Choose Your Plan</h2>
            <div className="space-y-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleCreateBusiness(plan.plan_key)}
                  disabled={loading}
                  className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-teal-500/30 hover:bg-white/[0.05] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{plan.plan_name}</h3>
                      <p className="text-sm text-slate-400">{plan.max_generations} AI generations/month, {plan.max_knowledge_files} knowledge files</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">Rs {plan.price_pkr.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">/month</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-4">
                <Loader2 size={16} className="animate-spin" /> Creating your business...
              </div>
            )}
            <button onClick={() => setStep(3)} className="btn-secondary"><ChevronLeft size={16} /> Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
