import { GlassCard, StatusBadge, PrivacyBadge } from './glass-card';
import { ArrowRight, Clock, Shield } from 'lucide-react';

interface Settlement {
  id: string;
  type: string;
  amount: string;
  asset: string;
  status: 'completed' | 'pending' | 'processing' | 'failed';
  privacyLevel: 'private' | 'public' | 'verified';
  timestamp: string;
  parties: number;
}

const mockSettlements: Settlement[] = [
  {
    id: 'STL-2026-0421',
    type: 'Real Estate Bond Settlement',
    amount: '2,450,000',
    asset: 'USDC',
    status: 'completed',
    privacyLevel: 'verified',
    timestamp: '2 hours ago',
    parties: 3,
  },
  {
    id: 'STL-2026-0420',
    type: 'Private Equity Distribution',
    amount: '8,750,000',
    asset: 'USDC',
    status: 'processing',
    privacyLevel: 'private',
    timestamp: '5 hours ago',
    parties: 7,
  },
  {
    id: 'STL-2026-0419',
    type: 'Commodities Trade Settlement',
    amount: '1,250,000',
    asset: 'USDT',
    status: 'completed',
    privacyLevel: 'verified',
    timestamp: '1 day ago',
    parties: 2,
  },
];

export function SettlementList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Settlements</h3>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
          View all
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {mockSettlements.map((settlement) => (
          <GlassCard key={settlement.id} className="p-5" hover>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{settlement.type}</h4>
                  <PrivacyBadge type={settlement.privacyLevel} />
                </div>
                <p className="text-xs text-muted-foreground">{settlement.id}</p>
              </div>
              <StatusBadge status={settlement.status} />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Amount</p>
                <p className="text-sm font-semibold text-foreground">
                  ${settlement.amount} {settlement.asset}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Parties</p>
                <p className="text-sm font-semibold text-foreground">{settlement.parties} participants</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Time</p>
                <p className="text-sm font-semibold text-foreground">{settlement.timestamp}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  icon: 'clock' | 'shield' | 'check';
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'Settlement Completed',
    description: 'Real Estate Bond Settlement finalized',
    timestamp: '2 hours ago',
    icon: 'check',
  },
  {
    id: '2',
    type: 'Privacy Proof Verified',
    description: 'Zero-knowledge proof validated for STL-2026-0420',
    timestamp: '5 hours ago',
    icon: 'shield',
  },
  {
    id: '3',
    type: 'Settlement Initiated',
    description: 'Private Equity Distribution started',
    timestamp: '5 hours ago',
    icon: 'clock',
  },
  {
    id: '4',
    type: 'Settlement Completed',
    description: 'Commodities Trade Settlement finalized',
    timestamp: '1 day ago',
    icon: 'check',
  },
];

export function ActivityFeed() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Activity Feed</h3>
      </div>

      <GlassCard className="p-5">
        <div className="space-y-4">
          {mockActivities.map((activity, index) => (
            <div key={activity.id}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activity.icon === 'check' 
                    ? 'bg-success/10 text-success' 
                    : activity.icon === 'shield'
                    ? 'bg-accent/10 text-accent'
                    : 'bg-warning/10 text-warning'
                }`}>
                  {activity.icon === 'clock' && <Clock className="w-4 h-4" />}
                  {activity.icon === 'shield' && <Shield className="w-4 h-4" />}
                  {activity.icon === 'check' && <div className="w-2 h-2 rounded-full bg-success" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.type}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{activity.timestamp}</p>
                </div>
              </div>
              {index < mockActivities.length - 1 && (
                <div className="h-px bg-border/50 my-4" />
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
