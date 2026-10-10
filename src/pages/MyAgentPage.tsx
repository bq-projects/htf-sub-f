import { useEffect, useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/ui';
import type { Agent } from '@/types/database';
import {
  Cpu, Save, Loader2, Bot, Sparkles
} from 'lucide-react';

export function MyAgentPage() {
  const { currentBusiness, agent, refreshAgent } = useBusiness();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    preferred_language: 'English',
    response_style: 'professional',
    tone: 'friendly',
    instructions: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description || '',
        preferred_language: agent.preferred_language,
        response_style: agent.response_style,
        tone: agent.tone,
        instructions: agent.instructions || '',
      });
    }
  }, [agent]);

  const handleSave = async () => {
    if (!currentBusiness) return;
    setSaving(true);
    if (agent) {
      const { error } = await supabase
        .from('agents')
        .update({
          name: formData.name,
          description: formData.description,
          preferred_language: formData.preferred_language,
          response_style: formData.response_style,
          tone: formData.tone,
          instructions: formData.instructions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agent.id);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Agent updated successfully!', 'success');
        refreshAgent();
      }
    } else {
      const { error } = await supabase
        .from('agents')
        .insert({
          business_id: currentBusiness.id,
          name: formData.name || 'Business Assistant',
          description: formData.description,
          preferred_language: formData.preferred_language,
          response_style: formData.response_style,
          tone: formData.tone,
          instructions: formData.instructions,
          status: 'active',
        });
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Agent created successfully!', 'success');
        refreshAgent();
      }
    }
    setSaving(false);
  };

  if (!currentBusiness) {
    return <EmptyState icon={Cpu} title="No business" description="Create a business first." />;
  }

  const languages = ['English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German'];
  const styles = ['professional', 'casual', 'concise', 'detailed', 'creative'];
  const tones = ['friendly', 'professional', 'formal', 'casual', 'enthusiastic', 'luxury'];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My AI Agent"
        subtitle="Configure your personalized business AI agent"
        icon={Cpu}
        action={<button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes</button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-white font-medium flex items-center gap-2"><Bot size={18} className="text-teal-400" /> Agent Identity</h3>

            <div>
              <label className="label-text">Agent Name</label>
              <input className="input-field" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. NovaTech Assistant" />
            </div>

            <div>
              <label className="label-text">Description</label>
              <textarea className="input-field min-h-[80px]" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="What does this agent do?" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-text">Language</label>
                <select className="input-field" value={formData.preferred_language} onChange={(e) => setFormData(prev => ({ ...prev, preferred_language: e.target.value }))}>
                  {languages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Response Style</label>
                <select className="input-field" value={formData.response_style} onChange={(e) => setFormData(prev => ({ ...prev, response_style: e.target.value }))}>
                  {styles.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Tone</label>
                <select className="input-field" value={formData.tone} onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}>
                  {tones.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label-text">Custom Instructions</label>
              <textarea className="input-field min-h-[120px]" value={formData.instructions} onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))} placeholder="Give your agent specific instructions on how to handle customer questions..." />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <Sparkles size={18} className="text-teal-400" />
              <h3 className="text-sm font-semibold text-white">Agent Preview</h3>
            </div>
            <div className="glass-card p-4 bg-white/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
                <Bot size={24} className="text-teal-400" />
              </div>
              <p className="text-white font-medium">{formData.name || 'Business Assistant'}</p>
              <p className="text-xs text-slate-400 mt-1">{formData.description || 'No description set'}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="badge-teal">{formData.preferred_language}</span>
                <span className="badge-blue">{formData.response_style}</span>
                <span className="badge-amber">{formData.tone}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-2">How it works</h3>
            <div className="space-y-2 text-xs text-slate-400">
              <p>1. User asks a question in AI Chat</p>
              <p>2. Agent retrieves relevant knowledge from your Knowledge Base</p>
              <p>3. Qwen3-4B reasons over the business context</p>
              <p>4. Agent provides a grounded, accurate response</p>
              <p>5. Response includes source citations when available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
