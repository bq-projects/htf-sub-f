import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/ui';
import { Mic, Sparkles, Loader2, Play, Download, Save } from 'lucide-react';

export function VoiceoverPage() {
  const { user } = useAuth();
  const { currentBusiness } = useBusiness();
  const { showToast } = useToast();
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; script_text: string; status: string; audio_url: string | null; created_at: string }[]>([]);

  const handleGenerateScript = async () => {
    if (!currentBusiness) return;
    setGeneratingScript(true);
    const businessContext = `Business: ${currentBusiness.name}\nIndustry: ${currentBusiness.industry}\nDescription: ${currentBusiness.description || ''}`;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: 'voiceover_script',
          businessContext,
          instructions: `Write a voiceover script for: ${topic}\nKeep it under 200 words. Professional and engaging.`,
          businessId: currentBusiness.id,
        }),
      });
      if (!response.ok) throw new Error(`Script generation failed (${response.status})`);
      const data = await response.json();
      setScript(data.response || 'Unable to generate script.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Script generation failed', 'error');
    }
    setGeneratingScript(false);
  };

  const handleGenerateAudio = async () => {
    if (!currentBusiness || !user || !script) return;
    setGeneratingAudio(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voiceover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: script,
          businessId: currentBusiness.id,
          userId: user.id,
        }),
      });
      if (!response.ok) throw new Error(`Voiceover failed (${response.status})`);
      const data = await response.json();

      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        showToast('Voiceover generated!', 'success');
      } else {
        showToast(data.error || data.message || 'Voiceover service not configured. Please set ELEVENLABS_API_KEY.', 'info');
      }

      const { data: newRecord } = await supabase.from('voiceover_generations').insert({
        business_id: currentBusiness.id,
        user_id: user.id,
        script_text: script,
        status: data.audioUrl ? 'completed' : 'failed',
        audio_url: data.audioUrl || null,
        error_message: data.error || null,
      }).select().single();

      if (newRecord) {
        setHistory(prev => [{ id: newRecord.id, script_text: newRecord.script_text, status: newRecord.status, audio_url: newRecord.audio_url, created_at: newRecord.created_at }, ...prev]);
      }

      await supabase.from('usage_events').insert({
        business_id: currentBusiness.id,
        user_id: user.id,
        type: 'voiceover',
        model_used: 'elevenlabs',
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Voiceover failed', 'error');
    }
    setGeneratingAudio(false);
  };

  if (!currentBusiness) {
    return <EmptyState icon={Mic} title="No business" description="Create a business first." />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Voiceover Studio" subtitle="Generate AI voiceovers for your marketing" icon={Mic} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-white font-medium">Generate Script</h3>
            <div>
              <label className="label-text">Topic / Campaign</label>
              <input className="input-field" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Summer Sale Promotion" />
            </div>
            <button onClick={handleGenerateScript} disabled={generatingScript || !topic} className="btn-primary w-full">
              {generatingScript ? <><Loader2 size={16} className="animate-spin" /> Writing...</> : <><Sparkles size={16} /> Generate Script</>}
            </button>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-white font-medium">Script Editor</h3>
            <textarea className="input-field min-h-[200px]" value={script} onChange={(e) => setScript(e.target.value)} placeholder="Your voiceover script will appear here. You can edit it before generating audio." />
            <button onClick={handleGenerateAudio} disabled={generatingAudio || !script} className="btn-primary w-full">
              {generatingAudio ? <><Loader2 size={16} className="animate-spin" /> Generating Audio...</> : <><Mic size={16} /> Generate Voiceover</>}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-white font-medium mb-4">Audio Preview</h3>
            {audioUrl ? (
              <div className="space-y-4">
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/mpeg" />
                </audio>
                <a href={audioUrl} download className="btn-secondary w-full"><Download size={16} /> Download Audio</a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3">
                  <Play size={28} className="text-slate-500" />
                </div>
                <p className="text-sm text-slate-400">Generate a script and voiceover to preview audio here</p>
                <p className="text-xs text-slate-500 mt-2">Requires ElevenLabs API key to be configured</p>
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-white font-medium mb-4">Recent Voiceovers</h3>
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-sm text-slate-300 line-clamp-2">{h.script_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={h.status === 'completed' ? 'badge-green' : 'badge-red'}>{h.status}</span>
                      <span className="text-xs text-slate-500">{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
