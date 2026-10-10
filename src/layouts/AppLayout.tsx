import { useState, type ReactNode } from 'react';
import { Link, useRouter } from '@/contexts/RouterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import {
  Bot, LayoutDashboard, MessageSquare, BookOpen, Cpu, Megaphone,
  Image, Calendar, Mic, History, CreditCard, Settings, User,
  LogOut, Menu, X, ChevronDown, Building2
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { path: '/agent', label: 'My AI Agent', icon: Cpu },
  { path: '/marketing', label: 'Marketing Studio', icon: Megaphone },
  { path: '/ad-creative', label: 'Ad Creative', icon: Image },
  { path: '/event-studio', label: 'Event Studio', icon: Calendar },
  { path: '/voiceover', label: 'Voiceover', icon: Mic },
  { path: '/campaigns', label: 'Campaign History', icon: History },
  { path: '/subscription', label: 'Subscription', icon: CreditCard },
];

const settingsItems = [
  { path: '/business-settings', label: 'Business Settings', icon: Settings },
  { path: '/profile-settings', label: 'Profile Settings', icon: User },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { path, navigate } = useRouter();
  const { user, profile, signOut } = useAuth();
  const { businesses, currentBusiness, setCurrentBusiness } = useBusiness();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const currentPlan = currentBusiness ? 'Free' : '';

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0f1420] border-r border-white/[0.06] flex flex-col z-40 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/[0.06]">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <span className="text-base font-semibold text-white">BizAgent OS</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Business Selector */}
        <div className="px-3 py-3 border-b border-white/[0.06] relative">
          <button
            onClick={() => setBusinessMenuOpen(!businessMenuOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/30 to-cyan-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Building2 size={16} className="text-teal-400" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentBusiness?.name || 'No Business'}
              </p>
              <p className="text-xs text-slate-500">{currentPlan} Plan</p>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${businessMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {businessMenuOpen && (
            <div className="absolute top-full left-3 right-3 mt-2 glass-card p-2 z-50 animate-slide-up">
              {businesses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setCurrentBusiness(b);
                    setBusinessMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${currentBusiness?.id === b.id ? 'bg-teal-500/10 text-teal-300' : 'text-slate-300 hover:bg-white/[0.06]'}`}
                >
                  {b.name}
                </button>
              ))}
              {businesses.length < 10 && (
                <button
                  onClick={() => {
                    navigate('/onboarding');
                    setBusinessMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-teal-400 hover:bg-teal-500/10 transition-all"
                >
                  + Add Business
                </button>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3.5 mb-2">Main</p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={path === item.path ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3.5 mb-2 mt-6">Settings</p>
          <div className="space-y-1">
            {settingsItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={path === item.path ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/[0.06] relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/10 border border-teal-500/20 flex items-center justify-center">
              <span className="text-sm font-medium text-teal-300">
                {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 glass-card p-2 z-50 animate-slide-up">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-20 bg-[#0f1420]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white">BizAgent OS</span>
          </div>
          <div className="w-11" />
        </div>

        <main className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
