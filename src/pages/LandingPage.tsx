import { Link } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bot, Brain, Sparkles, Mic, Zap, Shield, Globe, ChevronRight,
  MessageSquare, Megaphone, Image, Calendar, Rocket, Check
} from 'lucide-react';

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0e1a] bg-grid relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-white">BizAgent OS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/pricing" className="btn-ghost hidden sm:inline-flex">Pricing</Link>
          {user ? (
            <Link to="/dashboard" className="btn-primary">
              Dashboard <ChevronRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Sign In</Link>
              <Link to="/register" className="btn-primary">
                Get Started <ChevronRight size={16} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6 animate-fade-in">
          <Sparkles size={14} className="text-teal-400" />
          <span className="text-xs font-medium text-teal-300">Powered by Google Gemini + ElevenLabs</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6 animate-slide-up">
          Your Business.
          <br />
          <span className="gradient-text">Your AI Team.</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8 animate-slide-up">
          Transform your business knowledge into a personalized AI-powered team.
          Chat, marketing, ads, events, and voiceovers — all grounded in your data.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap animate-slide-up">
          <Link to="/register" className="btn-primary text-base px-7 py-3">
            <Rocket size={18} /> Start Free
          </Link>
          <Link to="/pricing" className="btn-secondary text-base px-7 py-3">
            View Plans
          </Link>
        </div>

        {/* AI Services */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-5xl mx-auto">
          {[
            { icon: Sparkles, title: 'Google Gemini', desc: 'AI intelligence for business chat, marketing, ads, and content generation', color: 'text-blue-400', border: 'border-blue-500/20' },
            { icon: Mic, title: 'ElevenLabs', desc: 'AI voiceovers for marketing campaigns, events, and ad narration', color: 'text-cyan-400', border: 'border-cyan-500/20' },
            { icon: Brain, title: 'Knowledge Engine', desc: 'Upload documents and URLs to teach your AI about your business', color: 'text-teal-400', border: 'border-teal-500/20' },
          ].map((s) => (
            <div key={s.title} className={`glass-card-hover p-6 text-left ${s.border}`}>
              <div className={`w-12 h-12 rounded-xl bg-white/[0.03] border ${s.border} flex items-center justify-center mb-4`}>
                <s.icon size={24} className={s.color} />
              </div>
              <h3 className="text-white font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Everything your business needs</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">From AI chat to marketing campaigns, all in one platform</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: MessageSquare, title: 'AI Business Chat', desc: 'Ask questions about your business and get grounded answers from your uploaded knowledge.' },
            { icon: Megaphone, title: 'Marketing Studio', desc: 'Generate Facebook, Instagram, LinkedIn posts, email copy, and promotional content.' },
            { icon: Image, title: 'Ad Creative Studio', desc: 'Create ad headlines, descriptions, CTAs, and visual concepts with your brand identity.' },
            { icon: Calendar, title: 'Event Marketing', desc: 'Build full event campaigns with announcements, reminders, and promotional materials.' },
            { icon: Mic, title: 'Voiceover Studio', desc: 'Generate AI voiceovers for your marketing content and event promotions.' },
            { icon: Brain, title: 'Knowledge Base', desc: 'Upload documents, add URLs, and let your AI agent learn about your business.' },
          ].map((f) => (
            <div key={f.title} className="glass-card-hover p-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/15 to-cyan-500/5 border border-teal-500/20 flex items-center justify-center mb-4">
                <f.icon size={20} className="text-teal-400" />
              </div>
              <h3 className="text-white font-medium mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Register', desc: 'Create your account and set up your business profile' },
            { step: '02', title: 'Add Knowledge', desc: 'Upload documents or add website URLs for your AI to learn' },
            { step: '03', title: 'Get AI Agent', desc: 'Your personalized business agent is created automatically' },
            { step: '04', title: 'Start Creating', desc: 'Chat, generate marketing, create ads, and produce voiceovers' },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">{s.step}</div>
              <h3 className="text-white font-medium mb-1">{s.title}</h3>
              <p className="text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="glass-card p-12 text-center gradient-border">
          <Zap size={32} className="text-teal-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">Ready to build your AI team?</h2>
          <p className="text-slate-400 mb-6">Start free. Upgrade when you need more power.</p>
          <Link to="/register" className="btn-primary text-base px-8 py-3">
            Get Started Free <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] mt-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-slate-300">BizAgent OS</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Shield size={14} /> Secure</span>
            <span className="flex items-center gap-1.5"><Globe size={14} /> Multi-language</span>
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
