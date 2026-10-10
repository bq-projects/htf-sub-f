import { useEffect, useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/ui';
import { Settings, Save, Loader2, Building2 } from 'lucide-react';

export function BusinessSettingsPage() {
  const { currentBusiness, refreshBusinesses } = useBusiness();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    industry: '',
    description: '',
    website: '',
    contact_email: '',
    phone: '',
    country: '',
    address: '',
    products_services: '',
    target_audience: '',
    preferred_language: 'English',
    brand_tone: 'Professional',
    business_goals: '',
  });

  useEffect(() => {
    if (currentBusiness) {
      setForm({
        name: currentBusiness.name || '',
        industry: currentBusiness.industry || '',
        description: currentBusiness.description || '',
        website: currentBusiness.website || '',
        contact_email: currentBusiness.contact_email || '',
        phone: currentBusiness.phone || '',
        country: currentBusiness.country || '',
        address: currentBusiness.address || '',
        products_services: currentBusiness.products_services || '',
        target_audience: currentBusiness.target_audience || '',
        preferred_language: currentBusiness.preferred_language || 'English',
        brand_tone: currentBusiness.brand_tone || 'Professional',
        business_goals: currentBusiness.business_goals || '',
      });
    }
  }, [currentBusiness]);

  const handleSave = async () => {
    if (!currentBusiness) return;
    setSaving(true);
    const { error } = await supabase
      .from('businesses')
      .update({
        name: form.name,
        industry: form.industry,
        description: form.description,
        website: form.website,
        contact_email: form.contact_email,
        phone: form.phone,
        country: form.country,
        address: form.address,
        products_services: form.products_services,
        target_audience: form.target_audience,
        preferred_language: form.preferred_language,
        brand_tone: form.brand_tone,
        business_goals: form.business_goals,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentBusiness.id);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Business settings saved!', 'success');
      refreshBusinesses();
    }
    setSaving(false);
  };

  if (!currentBusiness) {
    return <EmptyState icon={Settings} title="No business" description="Create a business first." />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Business Settings"
        subtitle={currentBusiness.name}
        icon={Settings}
        action={<button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes</button>}
      />

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-white font-medium flex items-center gap-2"><Building2 size={18} className="text-teal-400" /> Business Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">Business Name</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
          </div>
          <div>
            <label className="label-text">Industry</label>
            <input className="input-field" value={form.industry} onChange={(e) => setForm(prev => ({ ...prev, industry: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-text">Description</label>
            <textarea className="input-field min-h-[80px]" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
          </div>
          <div>
            <label className="label-text">Website</label>
            <input className="input-field" value={form.website} onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))} />
          </div>
          <div>
            <label className="label-text">Contact Email</label>
            <input className="input-field" value={form.contact_email} onChange={(e) => setForm(prev => ({ ...prev, contact_email: e.target.value }))} />
          </div>
          <div>
            <label className="label-text">Phone</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} />
          </div>
          <div>
            <label className="label-text">Country</label>
            <input className="input-field" value={form.country} onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-text">Address</label>
            <input className="input-field" value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4 mt-6">
        <h3 className="text-white font-medium">Products & Brand</h3>
        <div>
          <label className="label-text">Products & Services</label>
          <textarea className="input-field min-h-[80px]" value={form.products_services} onChange={(e) => setForm(prev => ({ ...prev, products_services: e.target.value }))} />
        </div>
        <div>
          <label className="label-text">Target Audience</label>
          <textarea className="input-field min-h-[60px]" value={form.target_audience} onChange={(e) => setForm(prev => ({ ...prev, target_audience: e.target.value }))} />
        </div>
        <div>
          <label className="label-text">Business Goals</label>
          <textarea className="input-field min-h-[60px]" value={form.business_goals} onChange={(e) => setForm(prev => ({ ...prev, business_goals: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Preferred Language</label>
            <input className="input-field" value={form.preferred_language} onChange={(e) => setForm(prev => ({ ...prev, preferred_language: e.target.value }))} />
          </div>
          <div>
            <label className="label-text">Brand Tone</label>
            <input className="input-field" value={form.brand_tone} onChange={(e) => setForm(prev => ({ ...prev, brand_tone: e.target.value }))} />
          </div>
        </div>
      </div>
    </div>
  );
}
