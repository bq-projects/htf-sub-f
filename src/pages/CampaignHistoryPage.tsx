import { useEffect, useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/ui';
import type { Campaign, GeneratedContent } from '@/types/database';
import { History, Megaphone, Calendar, Mic, Copy, Loader2 } from 'lucide-react';

export function CampaignHistoryPage() {
  const { currentBusiness } = useBusiness();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (!currentBusiness) return;
    const fetchData = async () => {
      const [campRes, contentRes] = await Promise.all([
        supabase.from('campaigns').select('*').eq('business_id', currentBusiness.id).order('created_at', { ascending: false }),
        supabase.from('generated_content').select('*').eq('business_id', currentBusiness.id).order('created_at', { ascending: false }),
      ]);
      setCampaigns((campRes.data ?? []) as Campaign[]);
      setContent((contentRes.data ?? []) as GeneratedContent[]);
      setLoading(false);
    };
    fetchData();
  }, [currentBusiness]);

  if (!currentBusiness) {
    return <EmptyState icon={History} title="No business" description="Create a business first." />;
  }

  const typeIcon = (type: string) => {
    if (type === 'event') return Calendar;
    if (type === 'voiceover') return Mic;
    return Megaphone;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Campaign History" subtitle={`${campaigns.length} campaigns • ${content.length} content pieces`} icon={History} />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-teal-400" /></div>
      ) : campaigns.length === 0 && content.length === 0 ? (
        <EmptyState icon={History} title="No campaigns yet" description="Your marketing campaigns and generated content will appear here." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Campaigns</h3>
            {campaigns.length === 0 ? (
              <p className="text-sm text-slate-500">No campaigns created yet</p>
            ) : (
              campaigns.map((c) => {
                const Icon = typeIcon(c.type);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCampaign(c)}
                    className={`w-full text-left glass-card-hover p-4 ${selectedCampaign?.id === c.id ? 'border-teal-500/30' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <Icon size={18} className="text-teal-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.type} • {new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="badge-green">{c.status}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Generated Content</h3>
            {content.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Megaphone size={28} className="text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No content generated yet</p>
              </div>
            ) : (
              content.map((item) => (
                <div key={item.id} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="badge-teal">{item.type}</span>
                      {item.platform && <span className="badge-blue">{item.platform}</span>}
                      {item.model_used && <span className="text-xs text-slate-500">{item.model_used}</span>}
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(item.content); }}
                      className="btn-ghost text-xs"
                    >
                      <Copy size={14} /> Copy
                    </button>
                  </div>
                  {item.title && <p className="text-sm font-medium text-white mb-1">{item.title}</p>}
                  <div className="text-sm text-slate-300 line-clamp-3 whitespace-pre-wrap">{item.content}</div>
                  <p className="text-xs text-slate-500 mt-2">{new Date(item.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
