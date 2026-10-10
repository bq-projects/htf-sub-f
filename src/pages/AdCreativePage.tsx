import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/ui';
import { Image, Sparkles, Copy, Loader2, Download } from 'lucide-react';

export function AdCreativePage() {
  const { user } = useAuth();
  const { currentBusiness } = useBusiness();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    product: '',
    objective: 'Conversion',
    audience: '',
    offer: '',
    platform: 'Facebook',
    format: 'Single Image Ad',
    instructions: '',
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ content: string; model: string } | null>(null);

  const handleGenerate = async () => {
    if (!currentBusiness) return;
    setGenerating(true);
    const businessContext = `Business: ${currentBusiness.name}
Industry: ${currentBusiness.industry}
Description: ${currentBusiness.description || ''}
Products: ${currentBusiness.products_services || ''}
Brand Colors: ${currentBusiness.brand_colors?.primary || '#14b8a6'}`;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: 'ad_creative',
          businessContext,
          instructions: `Product: ${form.product}
Objective: ${form.objective}
Audience: ${form.audience}
Offer: ${form.offer}
Platform: ${form.platform}
Format: ${form.format}
Additional: ${form.instructions}`,
          businessId: currentBusiness.id,
        }),
      });
      if (!response.ok) throw new Error(`Generation failed (${response.status})`);
      const data = await response.json();
      const content = data.response || 'Unable to generate.';
      const model = data.model || 'gemini';
      setResult({ content, model });

      if (user) {
        await supabase.from('generated_content').insert({
          business_id: currentBusiness.id,
          user_id: user.id,
          type: 'ad_creative',
          platform: form.platform,
          title: `Ad Creative — ${form.product}`,
          content,
          model_used: model,
        });
        await supabase.from('usage_events').insert({
          business_id: currentBusiness.id,
          user_id: user.id,
          type: 'ad_creative',
          model_used: model,
        });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Generation failed', 'error');
    }
    setGenerating(false);
  };

  if (!currentBusiness) {
    return <EmptyState icon={Image} title="No business" description="Create a business first." />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Ad Creative Studio" subtitle="Generate advertising creatives with AI" icon={Image} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-white font-medium">Ad Settings</h3>
          <div>
            <label className="label-text">Product / Service</label>
            <input className="input-field" value={form.product} onChange={(e) => setForm(prev => ({ ...prev, product: e.target.value }))} placeholder="e.g. Wireless Earbuds Pro" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Objective</label>
              <select className="input-field" value={form.objective} onChange={(e) => setForm(prev => ({ ...prev, objective: e.target.value }))}>
                <option>Conversion</option><option>Brand Awareness</option><option>Traffic</option><option>App Install</option>
              </select>
            </div>
            <div>
              <label className="label-text">Platform</label>
              <select className="input-field" value={form.platform} onChange={(e) => setForm(prev => ({ ...prev, platform: e.target.value }))}>
                <option>Facebook</option><option>Instagram</option><option>Google</option><option>TikTok</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-text">Target Audience</label>
            <input className="input-field" value={form.audience} onChange={(e) => setForm(prev => ({ ...prev, audience: e.target.value }))} placeholder="e.g. Tech enthusiasts 18-35" />
          </div>
          <div>
            <label className="label-text">Offer</label>
            <input className="input-field" value={form.offer} onChange={(e) => setForm(prev => ({ ...prev, offer: e.target.value }))} placeholder="e.g. 20% off first purchase" />
          </div>
          <div>
            <label className="label-text">Creative Format</label>
            <select className="input-field" value={form.format} onChange={(e) => setForm(prev => ({ ...prev, format: e.target.value }))}>
              <option>Single Image Ad</option><option>Carousel</option><option>Video Script</option><option>Story Ad</option>
            </select>
          </div>
          <div>
            <label className="label-text">Additional Instructions</label>
            <textarea className="input-field min-h-[60px]" value={form.instructions} onChange={(e) => setForm(prev => ({ ...prev, instructions: e.target.value }))} placeholder="Special requirements..." />
          </div>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary w-full">
            {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Ad Creative</>}
          </button>
        </div>

        <div>
          {!result ? (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center h-full">
              <Image size={32} className="text-slate-500 mb-3" />
              <p className="text-slate-400 text-sm">Ad creative will appear here</p>
            </div>
          ) : (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="badge-teal">{result.model}</span>
                <button onClick={() => { navigator.clipboard.writeText(result.content); showToast('Copied!', 'success'); }} className="btn-ghost text-xs"><Copy size={14} /> Copy</button>
              </div>
              <div className="prose-chat text-slate-200 whitespace-pre-wrap">{result.content}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
