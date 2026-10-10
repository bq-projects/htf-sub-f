import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/ui';
import { Calendar, Sparkles, Loader2, Copy, MapPin, Clock } from 'lucide-react';

export function EventStudioPage() {
  const { user } = useAuth();
  const { currentBusiness } = useBusiness();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    venue: '',
    description: '',
    audience: '',
    registrationUrl: '',
    cta: 'Register Now',
    language: 'English',
  });
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ title: string; content: string }[]>([]);

  const handleGenerate = async () => {
    if (!currentBusiness) return;
    setGenerating(true);
    const businessContext = `Business: ${currentBusiness.name}
Industry: ${currentBusiness.industry}
Description: ${currentBusiness.description || ''}
Tone: ${currentBusiness.brand_tone || 'Professional'}`;

    const eventDetails = `Event: ${form.name}
Date: ${form.date}
Time: ${form.time}
Venue: ${form.venue}
Description: ${form.description}
Audience: ${form.audience}
Registration URL: ${form.registrationUrl}
CTA: ${form.cta}
Language: ${form.language}`;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: 'event',
          businessContext,
          instructions: eventDetails,
          businessId: currentBusiness.id,
        }),
      });
      if (!response.ok) throw new Error(`Generation failed (${response.status})`);
      const data = await response.json();
      const content = data.response || 'Unable to generate.';
      const model = data.model || 'gemini';

      const parsedResults = [
        { title: 'Facebook Announcement', content: content.split('---')[0] || content },
        { title: 'Instagram Caption', content: content.split('---')[1] || '' },
        { title: 'LinkedIn Post', content: content.split('---')[2] || '' },
        { title: 'Reminder Message', content: content.split('---')[3] || '' },
      ].filter(r => r.content.trim());

      if (parsedResults.length === 0) {
        parsedResults.push({ title: 'Event Campaign Content', content });
      }

      setResults(parsedResults);

      if (user) {
        const { data: campaign } = await supabase.from('campaigns').insert({
          business_id: currentBusiness.id,
          user_id: user.id,
          name: form.name,
          type: 'event',
          status: 'active',
          event_details: { date: form.date, time: form.time, venue: form.venue, description: form.description },
        }).select().single();

        for (const r of parsedResults) {
          await supabase.from('generated_content').insert({
            business_id: currentBusiness.id,
            user_id: user.id,
            campaign_id: campaign?.id || null,
            type: 'event',
            title: r.title,
            content: r.content,
            model_used: model,
          });
        }
        await supabase.from('usage_events').insert({
          business_id: currentBusiness.id,
          user_id: user.id,
          type: 'event',
          model_used: model,
        });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Generation failed', 'error');
    }
    setGenerating(false);
  };

  if (!currentBusiness) {
    return <EmptyState icon={Calendar} title="No business" description="Create a business first." />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Event Marketing Studio" subtitle="Create event campaigns with AI" icon={Calendar} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-white font-medium">Event Details</h3>
          <div>
            <label className="label-text">Event Name</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Product Launch 2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Date</label>
              <input type="date" className="input-field" value={form.date} onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Time</label>
              <input type="time" className="input-field" value={form.time} onChange={(e) => setForm(prev => ({ ...prev, time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label-text">Venue</label>
            <input className="input-field" value={form.venue} onChange={(e) => setForm(prev => ({ ...prev, venue: e.target.value }))} placeholder="e.g. Convention Center, Islamabad" />
          </div>
          <div>
            <label className="label-text">Description</label>
            <textarea className="input-field min-h-[80px]" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Tell us about your event..." />
          </div>
          <div>
            <label className="label-text">Target Audience</label>
            <input className="input-field" value={form.audience} onChange={(e) => setForm(prev => ({ ...prev, audience: e.target.value }))} placeholder="Who should attend?" />
          </div>
          <div>
            <label className="label-text">Registration URL</label>
            <input className="input-field" value={form.registrationUrl} onChange={(e) => setForm(prev => ({ ...prev, registrationUrl: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">CTA</label>
              <input className="input-field" value={form.cta} onChange={(e) => setForm(prev => ({ ...prev, cta: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Language</label>
              <select className="input-field" value={form.language} onChange={(e) => setForm(prev => ({ ...prev, language: e.target.value }))}>
                <option>English</option><option>Urdu</option><option>Arabic</option>
              </select>
            </div>
          </div>
          <button onClick={handleGenerate} disabled={generating || !form.name} className="btn-primary w-full">
            {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Event Campaign</>}
          </button>
        </div>

        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center h-full">
              <Calendar size={32} className="text-slate-500 mb-3" />
              <p className="text-slate-400 text-sm">Event campaign content will appear here</p>
            </div>
          ) : (
            results.map((r, i) => (
              <div key={i} className="glass-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    {r.title.includes('Facebook') ? <Calendar size={14} /> : r.title.includes('Reminder') ? <Clock size={14} /> : <MapPin size={14} />}
                    {r.title}
                  </h4>
                  <button onClick={() => { navigator.clipboard.writeText(r.content); showToast('Copied!', 'success'); }} className="btn-ghost text-xs"><Copy size={14} /></button>
                </div>
                <div className="prose-chat text-slate-200 whitespace-pre-wrap text-sm">{r.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
