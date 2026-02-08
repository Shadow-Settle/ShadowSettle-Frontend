import { GlassCard } from './glass-card';
import {
  DashboardMetricCardSkeleton,
  DashboardActivityListSkeleton,
  DashboardSystemStatusSkeleton,
} from './skeletons';
import { Shield, Zap, CheckCircle, ArrowRight, DollarSign, Activity, TrendingUp, Server, Sparkles, BarChart3, ArrowUpRight } from 'lucide-react';
import type { DashboardStats as DashboardStatsType, ActivityItem, HealthChecks, NetworkInfo } from '../../utils/api';

type PageForActivity = 'results' | 'status' | 'jobs';

interface OverviewPageProps {
  onNavigate: (page: string) => void;
  walletAddress?: string;
  onSelectJobAndGoTo?: (taskId: string, page: PageForActivity) => void;
  /** Pre-fetched by App on load / wallet connect */
  dashboardStats?: DashboardStatsType | null;
  dashboardActivity?: ActivityItem[];
  healthChecks?: HealthChecks | null;
  networkInfo?: NetworkInfo | null;
  dashboardLoading?: boolean;
}

function formatRelativeTime(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min !== 1 ? 's' : ''} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr !== 1 ? 's' : ''} ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day !== 1 ? 's' : ''} ago`;
  const month = Math.floor(day / 30);
  return `${month} month${month !== 1 ? 's' : ''} ago`;
}

/** Single source of truth: activity type -> title, icon, and Tailwind classes for icon bg and text */
const ACTIVITY_TYPE_CONFIG: Record<
  ActivityItem['type'],
  { title: string; icon: typeof Shield; iconBg: string; amountBg: string; amountText: string }
> = {
  job_started: {
    title: 'Confidential Job Started',
    icon: Shield,
    iconBg: 'bg-accent/10 border-accent/20 text-accent',
    amountBg: 'bg-accent/10 border-accent/20',
    amountText: 'text-accent',
  },
  job_completed: {
    title: 'Job Completed',
    icon: CheckCircle,
    iconBg: 'bg-success/10 border-success/20 text-success',
    amountBg: 'bg-success/10 border-success/20',
    amountText: 'text-success',
  },
  settlement_executed: {
    title: 'On-chain Settlement Executed',
    icon: TrendingUp,
    iconBg: 'bg-info/10 border-info/20 text-info',
    amountBg: 'bg-info/10 border-info/20',
    amountText: 'text-info',
  },
};

function getActivityAmountLabel(item: ActivityItem): string {
  if (item.participants != null && item.participants > 0 && item.type === 'job_started')
    return `${item.participants} participants`;
  if (item.totalPayout != null && item.totalPayout > 0)
    return `$${item.totalPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (item.participants != null && item.participants > 0)
    return `${item.participants} recipients`;
  return '';
}

export function OverviewPage({
  onNavigate,
  walletAddress,
  onSelectJobAndGoTo,
  dashboardStats: stats = null,
  dashboardActivity: activity = [],
  healthChecks: health = null,
  networkInfo: networkInfoProp = null,
  dashboardLoading: loading = false,
}: OverviewPageProps) {
  const healthCheckedAt = health?.checkedAt ?? null;

  const totalFunds =
    typeof stats?.totalFundsDepositedNum === 'number'
      ? `$${stats.totalFundsDepositedNum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
      : stats?.totalFundsDeposited != null && stats.totalFundsDeposited !== ''
        ? `$${stats.totalFundsDeposited}`
        : '—';
  const activePools = stats?.activePools ?? 0;
  const jobsRunning = stats?.jobsRunning ?? 0;
  const settlementsCompleted = stats?.settlementsCompleted ?? 0;

  const metrics = [
    {
      label: 'Total Funds Deposited',
      value: totalFunds,
      change: '',
      trend: 'neutral' as const,
      icon: DollarSign,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      subtext: 'USDC',
      gradient: 'from-primary/20 to-primary/5',
      color: 'primary',
    },
    {
      label: 'Active Settlement Pools',
      value: String(activePools),
      change: '',
      trend: 'neutral' as const,
      icon: Activity,
      iconColor: 'text-accent',
      iconBg: 'bg-accent/10',
      subtext: 'Ready to settle',
      gradient: 'from-accent/20 to-accent/5',
      color: 'accent',
    },
    {
      label: 'Jobs Running in TEE',
      value: String(jobsRunning),
      change: jobsRunning > 0 ? 'Live' : '',
      trend: 'neutral' as const,
      icon: Shield,
      iconColor: 'text-success',
      iconBg: 'bg-success/10',
      subtext: 'Processing',
      gradient: 'from-success/20 to-success/5',
      color: 'success',
    },
    {
      label: 'Settlements Completed',
      value: String(settlementsCompleted),
      change: '',
      trend: 'neutral' as const,
      icon: CheckCircle,
      iconColor: 'text-info',
      iconBg: 'bg-info/10',
      subtext: 'All time',
      gradient: 'from-info/20 to-info/5',
      color: 'info',
    },
  ];

  const allHealthy = health ? health.backend && health.iexec && health.chain : false;
  const gasBadgeInfo =
    networkInfoProp?.gasPriceGwei != null ? gasBadge(networkInfoProp.gasPriceGwei) : null;

  function gasBadge(gwei: number): { label: string; className: string } {
    if (gwei < 0.1) return { label: 'Low', className: 'bg-success/10 border-success/20 text-success' };
    if (gwei < 1) return { label: 'Medium', className: 'bg-warning/10 border-warning/20 text-warning' };
    return { label: 'High', className: 'bg-destructive/10 border-destructive/20 text-destructive' };
  }

  const systemStatus = [
    { label: 'iExec Confidential Compute', up: health?.iexec ?? false, statusText: 'Operational' },
    { label: 'Blockchain Network', up: health?.chain ?? false, statusText: 'Arbitrum Sepolia' },
    { label: 'Backend Coordinator', up: health?.backend ?? false, statusText: 'Active' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header with Gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl blur-3xl opacity-50" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Command center for confidential settlements</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${allHealthy ? 'bg-success/10 border-success/20' : 'bg-muted/30 border-border'}`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${allHealthy ? 'bg-success' : 'bg-muted-foreground'}`} />
              <span className={`text-xs font-medium ${allHealthy ? 'text-success' : 'text-muted-foreground'}`}>
                {health ? (allHealthy ? 'All Systems Live' : 'Some systems offline') : 'Checking…'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <DashboardMetricCardSkeleton key={i} />
            ))}
          </>
        ) : (
          metrics.map((metric, index) => (
            <GlassCard
              key={index}
              className={`p-6 relative overflow-hidden group hover:border-${metric.color}/30 transition-all cursor-pointer`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${metric.iconBg} border border-${metric.color}/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <metric.icon className={`w-6 h-6 ${metric.iconColor}`} />
                  </div>
                  {(metric.change && metric.change !== '—') && (
                    <div className="px-2.5 py-1 rounded-md bg-success/10 border border-success/20 flex items-center gap-1">
                      {metric.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-success" />}
                      <span className="text-xs font-medium text-success">{metric.change}</span>
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <p className="text-4xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    {metric.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded-full bg-muted/30 border border-border/50">
                    <span className="text-xs text-muted-foreground font-medium">{metric.subtext}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Activity & Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Activity - Enhanced */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-accent" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              </div>
              <button
                onClick={() => onNavigate('jobs')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <GlassCard className="p-6">
              <div className="space-y-2">
                {loading && (
                  <DashboardActivityListSkeleton rows={5} />
                )}
                {!loading && activity.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    {walletAddress ? 'No recent activity for your wallet.' : 'Connect your wallet to see your activity.'}
                  </p>
                )}
                {!loading && activity.map((item, index) => {
                  const config = ACTIVITY_TYPE_CONFIG[item.type];
                  const Icon = config.icon;
                  const amountLabel = getActivityAmountLabel(item);
                  return (
                    <div
                      key={`${item.taskId}-${item.type}-${item.timestamp}`}
                      onClick={() => {
                        if (onSelectJobAndGoTo) {
                          const page: PageForActivity =
                            item.type === 'job_started' ? 'status' : 'results';
                          onSelectJobAndGoTo(item.taskId, page);
                        } else {
                          onNavigate('jobs');
                        }
                      }}
                      className="group relative flex items-center gap-4 p-4 rounded-xl hover:bg-accent/5 transition-all cursor-pointer border border-transparent hover:border-border/50"
                    >
                      {index < activity.length - 1 && (
                        <div className="absolute left-7 top-16 w-0.5 h-6 bg-gradient-to-b from-border to-transparent" />
                      )}

                      <div className={`relative w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${config.iconBg}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {config.title}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {formatRelativeTime(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-1.5">
                          {item.settlementName}
                        </p>
                        {amountLabel && (
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-0.5 rounded-md border ${config.amountBg}`}>
                              <span className={`text-xs font-medium ${config.amountText}`}>{amountLabel}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Quick Actions - Enhanced */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigate('create-pool')}
                className="group relative p-6 rounded-xl border border-border hover:border-primary/50 transition-all text-left overflow-hidden"
              >
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    Create Settlement Pool
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Fund a new settlement with treasury-grade deposits
                  </p>
                  <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Get started</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('create')}
                className="group relative p-6 rounded-xl border border-border hover:border-accent/50 transition-all text-left overflow-hidden"
              >
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent/20 transition-all duration-300">
                    <Shield className="w-6 h-6 text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-accent transition-colors">
                    Run Confidential Compute
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Execute private logic inside TEE environments
                  </p>
                  <div className="flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Launch job</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('jobs')}
                className="group relative p-6 rounded-xl border border-border hover:border-success/50 transition-all text-left overflow-hidden"
              >
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-success/20 transition-all duration-300">
                    <BarChart3 className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-success transition-colors">
                    View Settlement Jobs
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Monitor jobs, results, and outcomes
                  </p>
                  <div className="flex items-center gap-1 text-xs text-success opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View all</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Status & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* System Status - Enhanced */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
                <Server className="w-4 h-4 text-success" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">System Status</h2>
            </div>
            
            <GlassCard className="p-6">
              {health == null ? (
                <DashboardSystemStatusSkeleton />
              ) : (
                <>
                  <div className="space-y-4">
                    {systemStatus.map((item, index) => (
                      <div key={index} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${
                                  item.up ? 'bg-success' : 'bg-warning'
                                } ${item.up ? 'animate-pulse' : ''}`}
                              />
                              {item.up && (
                                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-success animate-ping opacity-75" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground">{item.label}</span>
                          </div>
                          <span className={`text-xs font-medium ${item.up ? 'text-success' : 'text-warning'}`}>
                            {item.up ? 'Up' : 'Down'}
                          </span>
                        </div>
                        <div className="ml-6 pl-2.5">
                          <span className="text-xs text-muted-foreground">{item.statusText}</span>
                        </div>
                        {index < systemStatus.length - 1 && (
                          <div className="mt-4 border-b border-border/50" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <div className={`flex items-start gap-3 p-3 rounded-lg border ${allHealthy ? 'bg-success/5 border-success/20' : 'bg-muted/20 border-border'}`}>
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${allHealthy ? 'text-success' : 'text-muted-foreground'}`} />
                      <div>
                        <p className={`text-sm font-semibold mb-0.5 ${allHealthy ? 'text-success' : 'text-muted-foreground'}`}>
                          {allHealthy ? 'All Systems Operational' : 'Some systems offline'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {healthCheckedAt ? `Last checked: ${formatRelativeTime(healthCheckedAt)}` : 'Checking…'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </GlassCard>
          </div>

          {/* TEE Security Card - Enhanced */}
          <GlassCard className="p-6 relative overflow-hidden border-accent/30">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-primary/5 to-transparent" />
            <div className="relative">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Confidential Computing</h3>
                  <p className="text-xs text-muted-foreground">Hardware-enforced privacy</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Data encrypted before upload
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Decryption only inside TEE enclaves
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Results cryptographically verified
                  </p>
                </div>
              </div>

              <button className="mt-4 w-full px-4 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20 text-xs font-medium text-accent transition-all flex items-center justify-center gap-2">
                Learn about TEE security
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </GlassCard>

          {/* Network Info - Enhanced (real data from backend) */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-info/10 border border-info/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-info" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Network Info</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-xs text-muted-foreground font-medium">Network</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    {networkInfoProp?.network ?? '—'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-xs text-muted-foreground font-medium">Block Height</span>
                <span className="text-xs font-mono font-semibold text-foreground">
                  {networkInfoProp?.blockHeight != null
                    ? networkInfoProp.blockHeight.toLocaleString()
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-xs text-muted-foreground font-medium">Gas Price</span>
                <div className="flex items-center gap-1">
                  {gasBadgeInfo ? (
                    <>
                      <span className="text-xs font-semibold text-foreground">
                        {networkInfoProp!.gasPriceGwei.toFixed(2)} gwei
                      </span>
                      <div className={`px-1.5 py-0.5 rounded border ${gasBadgeInfo.className}`}>
                        <span className="text-xs font-medium">{gasBadgeInfo.label}</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}