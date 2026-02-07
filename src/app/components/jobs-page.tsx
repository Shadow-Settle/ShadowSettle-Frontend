import { GlassCard } from './glass-card';
import { JobsTableSkeleton } from './skeletons';
import { FileJson, CheckCircle, Clock, AlertCircle, Search, Filter, X, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { SettlementRunState } from '../App';

function formatRelativeTime(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000);
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

interface JobRow {
  run: SettlementRunState;
  id: string;
  fullId: string;
  name: string;
  status: 'settled' | 'completed' | 'processing' | 'failed';
  participants: number;
  totalPayout: string;
  timestamp: string;
  network: string;
}

function runToJobRow(run: SettlementRunState): JobRow {
  const taskId = run.taskId ?? '';
  const id = taskId.length > 20 ? `${taskId.slice(0, 10)}...${taskId.slice(-8)}` : taskId || '—';
  const hasResult = run.result != null;
  const hasError = !!run.error;
  const isSettled = !!run.settledTxHash;
  const status: JobRow['status'] = isSettled ? 'settled' : hasResult ? 'completed' : hasError ? 'failed' : 'processing';
  const participants = run.result?.payouts?.length ?? 0;
  const total = run.result?.payouts?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0;
  const totalPayout = hasResult ? `$${total.toLocaleString()}` : '$0';
  const timestamp = run.submittedAt ? formatRelativeTime(run.submittedAt) : '—';
  return {
    run,
    id,
    fullId: taskId || '—',
    name: run.settlementName || 'Settlement',
    status,
    participants,
    totalPayout,
    timestamp,
    network: 'Arbitrum Sepolia',
  };
}

interface JobsPageProps {
  jobs: SettlementRunState[];
  onSelectJob: (run: SettlementRunState) => void;
  onNavigate: (page: string) => void;
  jobsLoading?: boolean;
}

export function JobsPage({ jobs: settlementRuns, onSelectJob, onNavigate, jobsLoading = false }: JobsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const jobs = useMemo(() => settlementRuns.map(runToJobRow), [settlementRuns]);

  const statusConfig: Record<JobRow['status'], { label: string; icon: typeof CheckCircle; className: string }> = {
    settled: {
      label: 'Settled',
      icon: CheckCircle,
      className: 'bg-success/10 border-success/20 text-success',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle,
      className: 'bg-primary/10 border-primary/20 text-primary',
    },
    processing: {
      label: 'Processing',
      icon: Clock,
      className: 'bg-muted border-border text-muted-foreground',
    },
    failed: {
      label: 'Failed',
      icon: AlertCircle,
      className: 'bg-destructive/10 border-destructive/20 text-destructive',
    },
  };

  const filterOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'settled', label: 'Settled' },
    { value: 'completed', label: 'Completed' },
    { value: 'processing', label: 'Processing' },
    { value: 'failed', label: 'Failed' },
  ];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchQuery === '' ||
      job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.fullId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeFilterLabel = filterOptions.find((opt) => opt.value === statusFilter)?.label || 'All Status';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Settlement Jobs</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all confidential settlement computations
          </p>
        </div>
        <button
          onClick={() => onNavigate('create')}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          Create New Settlement
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or job ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent/5 transition-all"
          >
            <Filter className="w-4 h-4" />
            {activeFilterLabel}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showFilterDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFilterDropdown(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-background shadow-lg z-20 py-1">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      statusFilter === option.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-accent/5'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active Filters Indicator */}
      {(searchQuery || statusFilter !== 'all') && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
              Search: "{searchQuery}"
              <button
                onClick={() => setSearchQuery('')}
                className="hover:bg-primary/20 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {statusFilter !== 'all' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
              Status: {activeFilterLabel}
              <button
                onClick={() => setStatusFilter('all')}
                className="hover:bg-accent/20 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Jobs Table */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
        {jobsLoading ? (
            <JobsTableSkeleton rows={6} />
          ) : settlementRuns.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                <FileJson className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No settlement jobs yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Create a confidential settlement to see jobs here
              </p>
              <button
                onClick={() => onNavigate('create')}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Create New Settlement
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No jobs found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Job</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Participants</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Total Payout</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Network</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job, index) => {
                  const status = statusConfig[job.status];
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={job.run.taskId ?? index}
                      onClick={() => {
                        onSelectJob(job.run);
                        onNavigate(job.status === 'processing' ? 'status' : 'results');
                      }}
                      className="border-b border-border/50 last:border-0 hover:bg-accent/5 transition-colors cursor-pointer"
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                            <FileJson className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground mb-0.5">{job.name}</p>
                            <p className="text-xs font-mono text-muted-foreground">{job.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${status.className}`}
                        >
                          {job.status === 'processing' ? (
                            <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          ) : (
                            <StatusIcon className="w-3 h-3" />
                          )}
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-sm text-foreground">{job.participants}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-sm font-medium text-foreground">{job.totalPayout}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-xs text-muted-foreground">{job.network}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-xs text-muted-foreground">{job.timestamp}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Results Count */}
        {settlementRuns.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Showing {filteredJobs.length} of {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </GlassCard>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <p className="text-xs text-muted-foreground mb-2">Total Jobs</p>
          <p className="text-2xl font-semibold text-foreground">{jobs.length}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-xs text-muted-foreground mb-2">Active Processing</p>
          <p className="text-2xl font-semibold text-foreground">
            {jobs.filter((j) => j.status === 'processing').length}
          </p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-xs text-muted-foreground mb-2">Success Rate</p>
          <p className="text-2xl font-semibold text-foreground">
            {jobs.length === 0 ? '—' : `${Math.round((jobs.filter((j) => j.status === 'completed').length / jobs.length) * 100)}%`}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}