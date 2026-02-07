/**
 * Layout-matching skeletons for dark theme. Show only when data is loading.
 */
import { Skeleton } from './ui/skeleton';
import { GlassCard } from './glass-card';

export function DashboardMetricCardSkeleton() {
  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <Skeleton className="h-6 w-14 rounded-md" />
      </div>
      <div className="mb-3">
        <Skeleton className="h-10 w-28 mb-2" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </GlassCard>
  );
}

export function DashboardActivityRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50">
      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between gap-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-16 shrink-0" />
        </div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
    </div>
  );
}

export function DashboardActivityListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <DashboardActivityRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSystemStatusSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-2.5 h-2.5 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-3 w-8" />
          </div>
          <div className="ml-6 pl-2.5">
            <Skeleton className="h-3 w-24" />
          </div>
          {i < 3 && <div className="mt-4 border-b border-border/50" />}
        </div>
      ))}
      <div className="mt-6 pt-6 border-t border-border/50">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
          <Skeleton className="w-5 h-5 rounded shrink-0 mt-0.5" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileTreasuryCardSkeleton() {
  return (
    <GlassCard className="p-6">
      <Skeleton className="h-3 w-28 mb-2" />
      <Skeleton className="h-9 w-24 mb-1" />
      <Skeleton className="h-3 w-12" />
    </GlassCard>
  );
}

export function ProfileTreasuryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <ProfileTreasuryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function JobsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto">
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
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              <td className="py-4 pr-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </td>
              <td className="py-4 pr-4">
                <Skeleton className="h-6 w-20 rounded-md" />
              </td>
              <td className="py-4 pr-4">
                <Skeleton className="h-4 w-6" />
              </td>
              <td className="py-4 pr-4">
                <Skeleton className="h-4 w-14" />
              </td>
              <td className="py-4 pr-4">
                <Skeleton className="h-3 w-24" />
              </td>
              <td className="py-4">
                <Skeleton className="h-3 w-16" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
