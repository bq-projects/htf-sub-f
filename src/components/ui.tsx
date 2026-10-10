import { type ReactNode } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-teal-400" />;
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size={40} />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass-card ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, icon: Icon, action }: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/20 flex items-center justify-center">
            <Icon size={22} className="text-teal-400" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-500" />
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, color = 'teal' }: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'teal' | 'blue' | 'amber' | 'green' | 'red';
}) {
  const colorMap = {
    teal: 'from-teal-500/20 to-cyan-500/5 border-teal-500/20 text-teal-400',
    blue: 'from-blue-500/20 to-indigo-500/5 border-blue-500/20 text-blue-400',
    amber: 'from-amber-500/20 to-orange-500/5 border-amber-500/20 text-amber-400',
    green: 'from-emerald-500/20 to-green-500/5 border-emerald-500/20 text-emerald-400',
    red: 'from-red-500/20 to-rose-500/5 border-red-500/20 text-red-400',
  };
  return (
    <div className="glass-card-hover p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br border flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${maxWidth} w-full glass-card p-6 animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-thin`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast({ message, type = 'success', onClose }: {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}) {
  const colors = {
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    error: 'bg-red-500/15 border-red-500/30 text-red-300',
    info: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
  };
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`px-5 py-3 rounded-xl border backdrop-blur-xl text-sm font-medium ${colors[type]} flex items-center gap-3`}>
        {message}
        <button onClick={onClose} className="text-current opacity-60 hover:opacity-100">&times;</button>
      </div>
    </div>
  );
}
