import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/ui';
import {
  Megaphone, Sparkles, Copy, Save, Loader2, RefreshCw
} from 'lucide-react';

const platforms = ['Facebook', 'Instagram', 'LinkedIn', 'Twitter/X', 'WhatsApp', 'Email'];
const objectives = ['Brand Awareness', 'Product Promotion', 'Sale/Discount', 'New Launch', 'Engagement', 'Lead Generation'];
const tones = ['Professional', 'Friendly', 'Casual', 'Exciting', 'Urgent', 'Luxury'];

export function MarketingStudioPage() {
  const { user } = useAuth();
  const { currentBusiness, agent } = useBusiness();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    platform: 'Instagram',
    objective: 'Product Promotion',
    product: '',
    audience: '',
    tone: 'Friendly',
    language: 'English',
    length: 'Medium',
    instructions: '',
  });
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ content: string; model: string }[]>([]);

  const handleGenerate = async () => {
    if (!currentBusiness) return;
    setGenerating(true);

    const businessContext = `Business: ${currentBusiness.name}
Industry: ${currentBusiness.industry}
Description: ${currentBusiness.description || ''}
Products & Services: ${currentBusiness.products_services || ''}
Target Audience: ${form.audience || currentBusiness.target_audience || 'General customers'}
Brand Tone: ${form.tone}`;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: 'marketing',
          businessContext,
          instructions: `Platform: ${form.platform}
Objective: ${form.objective}
Product/Service: ${form.product}
Tone: ${form.tone}
Language: ${form.language}
Length: ${form.length}
Additional: ${form.instructions}`,
          businessId: currentBusiness.id,
        }),
      });

      if (!response.ok) throw new Error(`Generation failed (${response.status})`);
      const data = await response.json();
      const content = data.response || data.error || 'Unable to generate content.';
      const model = data.model || 'gemini';

      setResults([{ content, model }]);

      if (user) {
        await supabase.from('generated_content').insert({
          business_id: currentBusiness.id,
          user_id: user.id,
          type: 'marketing',
          platform: form.platform,
          title: `${form.platform} post — ${form.objective}`,
          content,
          model_used: model,
        });
        await supabase.from('usage_events').insert({
          business_id: currentBusiness.id,
          user_id: user.id,
          type: 'marketing',
          model_used: model,
        });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Generation failed', 'error');
    }
    setGenerating(false);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast('Copied!', 'success');
  };

  if (!currentBusiness) {
    return <EmptyState icon={Megaphone} title="No business" description="Create a business first." />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Marketing Studio" subtitle="Generate social media content with AI" icon={Megaphone} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-white font-medium">Content Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Platform</label>
              <select className="input-field" value={form.platform} onChange={(e) => setForm(prev => ({ ...prev, platform: e.target.value }))}>
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text">Objective</label>
              <select className="input-field" value={form.objective} onChange={(e) => setForm(prev => ({ ...prev, objective: e.target.value }))}>
                {objectives.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label-text">Product / Service</label>
            <input className="input-field" value={form.product} onChange={(e) => setForm(prev => ({ ...prev, product: e.target.value }))} placeholder="e.g. Summer Collection Sale" />
          </div>

          <div>
            <label className="label-text">Target Audience</label>
            <input className="input-field" value={form.audience} onChange={(e) => setForm(prev => ({ ...prev, audience: e.target.value }))} placeholder="e.g. Young professionals aged 25-35" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-text">Tone</label>
              <select className="input-field" value={form.tone} onChange={(e) => setForm(prev => ({ ...prev, tone: e.target.value }))}>
                {tones.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text">Language</label>
              <select className="input-field" value={form.language} onChange={(e) => setForm(prev => ({ ...prev, language: e.target.value }))}>
                <option>English</option><option>Urdu</option><option>Arabic</option>
              </select>
            </div>
            <div>
              <label className="label-text">Length</label>
              <select className="input-field" value={form.length} onChange={(e) => setForm(prev => ({ ...prev, length: e.target.value }))}>
                <option>Short</option><option>Medium</option><option>Long</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-text">Additional Instructions</label>
            <textarea className="input-field min-h-[60px]" value={form.instructions} onChange={(e) => setForm(prev => ({ ...prev, instructions: e.target.value }))} placeholder="Any specific requirements..." />
          </div>

          <button onClick={handleGenerate} disabled={generating} className="btn-primary w-full">
            {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Content</>}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
              <Megaphone size={32} className="text-slate-500 mb-3" />
              <p className="text-slate-400 text-sm">Generated content will appear here</p>
            </div>
          ) : (
            results.map((result, i) => (
              <div key={i} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge-teal">{result.model}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleCopy(result.content)} className="btn-ghost text-xs"><Copy size={14} /> Copy</button>
                    <button onClick={handleGenerate} className="btn-ghost text-xs"><RefreshCw size={14} /> Regenerate</button>
                  </div>
                </div>
                <div className="prose-chat text-slate-200 whitespace-pre-wrap">{result.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
