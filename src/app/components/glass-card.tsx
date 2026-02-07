import { LucideIcon } from 'lucide-react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className = '', hover = false }: GlassCardProps) {
  return (
    <div
      className={`
        rounded-xl border border-glass-border 
        bg-gradient-to-br from-glass-bg to-glass-bg/30
        backdrop-blur-xl
        ${hover ? 'transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
}

export function StatCard({ label, value, change, changeType = 'neutral', icon: Icon }: StatCardProps) {
  const changeColors = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  return (
    <GlassCard className="p-6" hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-semibold text-foreground mb-2">{value}</p>
          {change && (
            <p className={`text-xs ${changeColors[changeType]}`}>{change}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </GlassCard>
  );
}

interface StatusBadgeProps {
  status: 'completed' | 'pending' | 'processing' | 'failed';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const configs = {
    completed: {
      bg: 'bg-success/10',
      border: 'border-success/20',
      text: 'text-success',
      dot: 'bg-success',
      label: label || 'Completed',
    },
    pending: {
      bg: 'bg-muted/50',
      border: 'border-muted',
      text: 'text-muted-foreground',
      dot: 'bg-muted-foreground',
      label: label || 'Pending',
    },
    processing: {
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      text: 'text-warning',
      dot: 'bg-warning',
      label: label || 'Processing',
    },
    failed: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/20',
      text: 'text-destructive',
      dot: 'bg-destructive',
      label: label || 'Failed',
    },
  };

  const config = configs[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${config.bg} ${config.border}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'processing' ? 'animate-pulse' : ''}`} />
      <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
}

interface PrivacyBadgeProps {
  type: 'private' | 'public' | 'verified';
}

export function PrivacyBadge({ type }: PrivacyBadgeProps) {
  const configs = {
    private: {
      bg: 'bg-accent/10',
      border: 'border-accent/20',
      text: 'text-accent',
      label: 'Private',
    },
    public: {
      bg: 'bg-info/10',
      border: 'border-info/20',
      text: 'text-info',
      label: 'Public',
    },
    verified: {
      bg: 'bg-success/10',
      border: 'border-success/20',
      text: 'text-success',
      label: 'Verified',
    },
  };

  const config = configs[type];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${config.bg} ${config.border}`}>
      <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
}
