import { useEffect, useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { supabase } from '@/lib/supabase';
import { StatCard, PageHeader, EmptyState } from '@/components/ui';
import {
  MessageSquare, BookOpen, Megaphone, Image, Calendar, Mic,
  Bot, FileText, Sparkles, TrendingUp, Plus, Cpu
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const { currentBusiness, subscription, agent } = useBusiness();
  const { navigate } = useRouter();

  const [stats, setStats] = useState({
    conversations: 0,
    knowledgeSources: 0,
    generatedContent: 0,
    campaigns: 0,
    voiceovers: 0,
    monthlyUsage: 0,
  });
  const [recentChats, setRecentChats] = useState<{ id: string; title: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!currentBusiness) return;
    const fetchStats = async () => {
      const [chats, knowledge, content, campaigns, voiceovers, usage] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', currentBusiness.id),
        supabase.from('knowledge_sources').select('id', { count: 'exact', head: true }).eq('business_id', currentBusiness.id),
        supabase.from('generated_content').select('id', { count: 'exact', head: true }).eq('business_id', currentBusiness.id),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('business_id', currentBusiness.id),
        supabase.from('voiceover_generations').select('id', { count: 'exact', head: true }).eq('business_id', currentBusiness.id),
        supabase.from('usage_events').select('id', { count: 'exact', head: true })
          .eq('business_id', currentBusiness.id)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      setStats({
        conversations: chats.count || 0,
        knowledgeSources: knowledge.count || 0,
        generatedContent: content.count || 0,
        campaigns: campaigns.count || 0,
        voiceovers: voiceovers.count || 0,
        monthlyUsage: usage.count || 0,
      });

      const { data: recent } = await supabase
        .from('conversations')
        .select('id, title, created_at')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false })
        .limit(3);
      setRecentChats((recent ?? []) as { id: string; title: string; created_at: string }[]);
    };
    fetchStats();
  }, [currentBusiness]);

  if (!currentBusiness) {
    return (
      <EmptyState
        icon={Bot}
        title="No business yet"
        description="Create your first business workspace to get started with your AI team."
        action={<button onClick={() => navigate('/onboarding')} className="btn-primary"><Plus size={16} /> Create Business</button>}
      />
    );
  }

  const planName = subscription?.plan || 'free';
  const planDisplay = planName.charAt(0).toUpperCase() + planName.slice(1);

  const quickActions = [
    { label: 'Chat with Agent', icon: MessageSquare, path: '/chat', color: 'teal' as const },
    { label: 'Upload Knowledge', icon: BookOpen, path: '/knowledge', color: 'blue' as const },
    { label: 'Create Social Post', icon: Megaphone, path: '/marketing', color: 'amber' as const },
    { label: 'Generate Ad', icon: Image, path: '/ad-creative', color: 'green' as const },
    { label: 'Create Event Campaign', icon: Calendar, path: '/event-studio', color: 'teal' as const },
    { label: 'Generate Voiceover', icon: Mic, path: '/voiceover', color: 'blue' as const },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={currentBusiness.name}
        icon={Bot}
        action={
          <div className="flex items-center gap-3">
            <span className="badge-teal">{planDisplay} Plan</span>
            <span className="badge-green flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Agent Active
            </span>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Conversations" value={stats.conversations} icon={MessageSquare} color="teal" />
        <StatCard label="Knowledge Sources" value={stats.knowledgeSources} icon={FileText} color="blue" />
        <StatCard label="Generated Content" value={stats.generatedContent} icon={Sparkles} color="amber" />
        <StatCard label="Campaigns" value={stats.campaigns} icon={TrendingUp} color="green" />
        <StatCard label="Voiceovers" value={stats.voiceovers} icon={Mic} color="blue" />
        <StatCard label="Monthly Usage" value={stats.monthlyUsage} icon={Cpu} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="glass-card-hover p-4 flex items-center gap-3 text-left group"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/15 to-cyan-500/5 border border-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <action.icon size={20} className="text-teal-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{action.label}</p>
                </div>
                <ChevronRight />
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* Agent Status */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <Cpu size={18} className="text-teal-400" />
              <h3 className="text-sm font-semibold text-white">AI Agent</h3>
            </div>
            <p className="text-sm text-white font-medium">{agent?.name || 'Business Assistant'}</p>
            <p className="text-xs text-slate-400 mt-1">
              {agent ? `${agent.response_style} • ${agent.tone}` : 'No agent configured'}
            </p>
            <button onClick={() => navigate('/agent')} className="btn-ghost w-full mt-3 justify-center text-xs">
              Configure Agent
            </button>
          </div>

          {/* Recent Conversations */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Recent Conversations</h3>
            {recentChats.length > 0 ? (
              <div className="space-y-2">
                {recentChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => navigate('/chat')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-all"
                  >
                    <p className="text-sm text-slate-300 truncate">{chat.title}</p>
                    <p className="text-xs text-slate-500">{new Date(chat.created_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No conversations yet</p>
            )}
            <button onClick={() => navigate('/chat')} className="btn-ghost w-full mt-3 justify-center text-xs">
              Start New Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
