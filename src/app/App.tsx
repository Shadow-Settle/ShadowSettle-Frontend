import { AppHeader } from './components/app-header';
import { AppFooter } from './components/app-footer';
import { LandingPage } from './components/landing-page';
import { OverviewPage } from './components/overview-page';
import { JobsPage } from './components/jobs-page';
import { ProfilePage } from './components/profile-page';
import { CreateSettlement } from './components/create-settlement';
import { CreatePool } from './components/create-pool';
import { SettlementStatus } from './components/settlement-status';
import { SettlementResults } from './components/settlement-results';
import { PrivacyTrustModel } from './components/privacy-trust-model';
import { WalletConnectModal } from './components/wallet-connect-modal';
import { useState, useEffect, useRef } from 'react';
import {
  listJobs,
  createJob,
  updateJobByTaskId,
  getDashboardStats,
  getDashboardActivity,
  getHealthChecks,
  getTreasuryBalance,
  getNetworkInfo,
  type JobResponse,
  type DashboardStats,
  type ActivityItem,
  type HealthChecks,
  type NetworkInfo,
} from '../utils/api';

type PageType = 'landing' | 'overview' | 'create' | 'create-pool' | 'jobs' | 'profile' | 'status' | 'results' | 'trust';

const PAGE_TO_HASH: Record<PageType, string> = {
  landing: '#/',
  overview: '#/overview',
  create: '#/create',
  'create-pool': '#/create-pool',
  jobs: '#/jobs',
  profile: '#/profile',
  status: '#/status',
  results: '#/results',
  trust: '#/trust',
};

const HASH_TO_PAGE: Record<string, PageType> = {
  '': 'landing',
  '/': 'landing',
  '/overview': 'overview',
  '/create': 'create',
  '/create-pool': 'create-pool',
  '/jobs': 'jobs',
  '/profile': 'profile',
  '/status': 'status',
  '/results': 'results',
  '/trust': 'trust',
};

function getPageFromHash(): PageType {
  const hash = window.location.hash.slice(1).toLowerCase() || '/';
  return HASH_TO_PAGE[hash] ?? 'landing';
}

export type SettlementRunState = {
  taskId?: string;
  dealId?: string;
  settlementName: string;
  result?: { payouts: { wallet: string; amount: number }[]; tee_attestation: string };
  error?: string;
  /** When set, status page runs upload + submit and shows live logs */
  status?: 'submitting';
  fileContent?: object;
  datasetUrlOverride?: string;
  /** Set when taskId is first received (for Jobs "Created" column) */
  submittedAt?: number;
  /** Set when Settle On-Chain has been executed for this job */
  settledTxHash?: string;
};

export default function App() {
  const [currentPage, setCurrentPageState] = useState<PageType>(() => getPageFromHash());

  const setCurrentPage = (page: PageType) => {
    setCurrentPageState(page);
    const hash = PAGE_TO_HASH[page];
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash || '#/');
    }
  };
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>();
  const [settlementRun, setSettlementRun] = useState<SettlementRunState | null>(null);
  const [settlementRunHistory, setSettlementRunHistory] = useState<SettlementRunState[]>([]);
  const persistedTaskIdsRef = useRef<Set<string>>(new Set());

  // Pre-fetched data for all pages (loaded on app mount + wallet connect so pages open fast)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [dashboardActivity, setDashboardActivity] = useState<ActivityItem[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthChecks | null>(null);
  const [dashboardStatsLoading, setDashboardStatsLoading] = useState(true);
  const [dashboardActivityLoading, setDashboardActivityLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(true);
  const [treasuryBalance, setTreasuryBalance] = useState<string | null>(null);
  const [treasuryLoading, setTreasuryLoading] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  function jobToRunState(j: JobResponse): SettlementRunState {
    return {
      taskId: j.taskId,
      dealId: j.dealId ?? undefined,
      settlementName: j.settlementName || 'Settlement',
      result: j.result ?? undefined,
      error: j.error ?? undefined,
      datasetUrlOverride: j.datasetUrlOverride ?? undefined,
      submittedAt: j.submittedAt ?? undefined,
      settledTxHash: j.settledTxHash ?? undefined,
    };
  }

  const handleRunSettlement = (nextRun: SettlementRunState | null) => {
    if (nextRun?.status === 'submitting' && settlementRun && (settlementRun.taskId || settlementRun.result)) {
      setSettlementRunHistory((prev) => [settlementRun, ...prev]);
    }
    setSettlementRun(nextRun);
  };

  // Dedupe by taskId so the selected run (settlementRun) is not shown twice when it also appears in history
  const settlementJobs = (() => {
    const seen = new Set<string>();
    const out: SettlementRunState[] = [];
    const add = (r: SettlementRunState | null) => {
      if (!r || !(r.taskId != null || r.result != null || r.status === 'submitting')) return;
      const key = r.taskId ?? `no-task-${out.length}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(r);
    };
    if (settlementRun) add(settlementRun);
    settlementRunHistory.forEach(add);
    return out;
  })();

  const handleSelectJob = (run: SettlementRunState) => {
    setSettlementRun(run);
  };

  /** Load job by taskId for connected wallet, set as current run, and navigate to the given page. */
  const handleSelectJobAndGoTo = (taskId: string, page: 'results' | 'status' | 'jobs') => {
    if (!walletAddress) return;
    listJobs(walletAddress)
      .then((jobs) => {
        const job = jobs.find((j) => j.taskId === taskId);
        if (job) {
          setSettlementRun(jobToRunState(job));
          setCurrentPage(page);
        } else {
          setCurrentPage('jobs');
        }
      })
      .catch(() => setCurrentPage('jobs'));
  };

  const [jobsLoading, setJobsLoading] = useState(false);

  // Pre-fetch dashboard stats + health + network info on app load (no wallet needed)
  useEffect(() => {
    let cancelled = false;
    setDashboardStatsLoading(true);
    setHealthLoading(true);
    getDashboardStats()
      .then((d) => !cancelled && setDashboardStats(d))
      .catch(() => !cancelled && setDashboardStats(null))
      .finally(() => !cancelled && setDashboardStatsLoading(false));
    getHealthChecks()
      .then((h) => !cancelled && setHealthChecks(h))
      .catch(() => !cancelled && setHealthChecks(null))
      .finally(() => !cancelled && setHealthLoading(false));
    getNetworkInfo()
      .then((n) => !cancelled && setNetworkInfo(n))
      .catch((e) => {
        if (!cancelled) {
          console.warn('Network info unavailable:', e?.message ?? e);
          setNetworkInfo(null);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Pre-fetch dashboard activity + treasury when wallet connects
  useEffect(() => {
    if (!walletAddress) {
      setDashboardActivity([]);
      return;
    }
    let cancelled = false;
    setDashboardActivityLoading(true);
    setTreasuryLoading(true);
    getDashboardActivity(25, walletAddress)
      .then((r) => !cancelled && setDashboardActivity(r.activity))
      .catch(() => !cancelled && setDashboardActivity([]))
      .finally(() => !cancelled && setDashboardActivityLoading(false));
    getTreasuryBalance(true)
      .then((r) => !cancelled && setTreasuryBalance(r.balanceFormatted))
      .catch(() => !cancelled && setTreasuryBalance('0'))
      .finally(() => !cancelled && setTreasuryLoading(false));
    return () => { cancelled = true; };
  }, [walletAddress]);

  const refreshTreasuryBalance = () => {
    getTreasuryBalance(true)
      .then((r) => setTreasuryBalance(r.balanceFormatted))
      .catch(() => setTreasuryBalance('0'));
  };

  // Load persisted jobs from backend when wallet is connected
  useEffect(() => {
    if (!walletAddress) return;
    setJobsLoading(true);
    listJobs(walletAddress)
      .then((jobs) => {
        const runs = jobs.map(jobToRunState);
        setSettlementRunHistory(runs);
        runs.forEach((r) => r.taskId && persistedTaskIdsRef.current.add(r.taskId));
      })
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, [walletAddress]);

  // Persist current run to backend when it has taskId / result / error
  useEffect(() => {
    const run = settlementRun;
    if (!run?.taskId) return;
    const taskId = run.taskId;
    const alreadyPersisted = persistedTaskIdsRef.current.has(taskId);
    if (!alreadyPersisted) {
      createJob({
        walletAddress,
        taskId,
        dealId: run.dealId,
        settlementName: run.settlementName,
        status: run.status ?? 'submitted',
        result: run.result,
        error: run.error,
        datasetUrlOverride: run.datasetUrlOverride,
        submittedAt: run.submittedAt ?? Date.now(),
      }).then(() => persistedTaskIdsRef.current.add(taskId)).catch(() => {});
      return;
    }
    if (run.result != null || run.error != null) {
      updateJobByTaskId(taskId, {
        status: run.result ? 'completed' : 'failed',
        result: run.result,
        error: run.error,
      }).catch(() => {});
    }
  }, [settlementRun?.taskId, settlementRun?.result, settlementRun?.error, settlementRun?.dealId, settlementRun?.settlementName, settlementRun?.status, settlementRun?.datasetUrlOverride, settlementRun?.submittedAt, walletAddress]);

  // Sync route from browser hash (back/forward, direct link)
  useEffect(() => {
    const hash = PAGE_TO_HASH[currentPage];
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash || '#/');
    }
  }, [currentPage]);

  useEffect(() => {
    const onHashChange = () => setCurrentPageState(getPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Restore wallet session on mount (persists until tab close)
  useEffect(() => {
    import('../utils/wallet').then(({ loadWalletSession, getCurrentAccount, clearWalletSession }) => {
      const session = loadWalletSession();
      if (!session?.address) return;
      getCurrentAccount().then((current) => {
        if (current && current.toLowerCase() === session.address.toLowerCase()) {
          setWalletConnected(true);
          setWalletAddress(session.address);
        } else {
          clearWalletSession();
        }
      });
    });
  }, []);

  // Listen for wallet events (account changes, chain changes)
  useEffect(() => {
    if (walletConnected && walletAddress) {
      // Import wallet utilities
      import('../utils/wallet').then(({ onAccountsChanged, onChainChanged, saveWalletSession, clearWalletSession }) => {
        // Listen for account changes
        const cleanupAccounts = onAccountsChanged((accounts) => {
          if (accounts.length === 0) {
            handleDisconnectWallet();
          } else {
            const newAddress = accounts[0];
            if (newAddress && (!walletAddress || newAddress.toLowerCase() !== walletAddress.toLowerCase())) {
              setWalletAddress(newAddress);
              saveWalletSession(newAddress);
            }
          }
        });

        // Listen for chain changes
        const cleanupChain = onChainChanged(() => {
          window.location.reload();
        });

        return () => {
          cleanupAccounts();
          cleanupChain();
        };
      });
    }
  }, [walletConnected, walletAddress]);

  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  const handleWalletConnect = (address: string) => {
    setWalletConnected(true);
    setWalletAddress(address);
    setShowWalletModal(false);
    // Sync with MetaMask’s currently selected account (avoids showing old account after disconnect/reconnect)
    import('../utils/wallet').then(({ getCurrentAccount, saveWalletSession }) => {
      getCurrentAccount().then((current) => {
        const addr = current && current.length > 0 ? current : address;
        if (addr.toLowerCase() !== address.toLowerCase()) {
          setWalletAddress(addr);
        }
        saveWalletSession(addr);
      }).catch(() => saveWalletSession(address));
    });
  };

  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress(undefined);
    setSettlementRun(null);
    setSettlementRunHistory([]);
    setDashboardActivity([]);
    setTreasuryBalance(null);
    persistedTaskIdsRef.current.clear();
    try {
      sessionStorage.removeItem('shadowsettle_wallet');
    } catch {
      // ignore
    }
    import('../utils/wallet').then(({ disconnectWallet }) => {
      disconnectWallet();
    });
  };

  const handleLaunchApp = () => {
    setCurrentPage('overview');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onLaunchApp={handleLaunchApp} />;
      case 'overview':
        return (
          <OverviewPage
            onNavigate={setCurrentPage}
            walletAddress={walletAddress}
            onSelectJobAndGoTo={handleSelectJobAndGoTo}
            dashboardStats={dashboardStats}
            dashboardActivity={dashboardActivity}
            healthChecks={healthChecks}
            networkInfo={networkInfo}
            dashboardLoading={dashboardStatsLoading || healthLoading || (!!walletAddress && dashboardActivityLoading)}
          />
        );
      case 'create':
        return (
          <CreateSettlement
            onSubmit={() => setCurrentPage('status')}
            onRunSettlement={handleRunSettlement}
          />
        );
      case 'create-pool':
        return (
          <CreatePool
            onSubmit={() => setCurrentPage('create')}
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            onConnectWallet={handleConnectWallet}
          />
        );
      case 'jobs':
        return (
          <JobsPage
            jobs={settlementJobs}
            onSelectJob={handleSelectJob}
            onNavigate={setCurrentPage}
            jobsLoading={jobsLoading}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            onConnectWallet={handleConnectWallet}
            completedSettlementsCount={settlementJobs.filter((j) => j.result != null).length}
            pendingSettlementsCount={settlementJobs.filter((j) => j.taskId != null && j.result == null && j.status !== 'submitting').length}
            treasuryBalanceFromApp={treasuryBalance}
            treasuryLoadingFromApp={treasuryLoading}
            onRefreshTreasury={refreshTreasuryBalance}
          />
        );
      case 'status':
        return (
          <SettlementStatus
            settlementRun={settlementRun}
            onSettlementUpdate={setSettlementRun}
            onComplete={() => setCurrentPage('results')}
          />
        );
      case 'results':
        return (
          <SettlementResults
            settlementRun={settlementRun}
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            onConnectWallet={handleConnectWallet}
            onSettled={(txHash) => {
              if (settlementRun?.taskId) {
                updateJobByTaskId(settlementRun.taskId, { settledTxHash: txHash, settledAt: Date.now() }).catch(() => {});
                setSettlementRun((prev) => (prev ? { ...prev, settledTxHash: txHash } : null));
              }
            }}
          />
        );
      case 'trust':
        return <PrivacyTrustModel />;
      default:
        return <LandingPage onLaunchApp={handleLaunchApp} />;
    }
  };

  const isLandingPage = currentPage === 'landing';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark flex flex-col">
      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleWalletConnect}
      />

      {/* Conditional Header - Only show on dashboard pages */}
      {!isLandingPage && (
        <AppHeader
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          walletConnected={walletConnected}
          walletAddress={walletAddress}
          onConnectWallet={handleConnectWallet}
          onDisconnectWallet={handleDisconnectWallet}
        />
      )}

      {/* Main Content */}
      {isLandingPage ? (
        <main className="flex-1">
          {renderPage()}
        </main>
      ) : (
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-8 py-12">
          {renderPage()}
        </main>
      )}

      {/* Conditional Footer - Only show on dashboard pages */}
      {!isLandingPage && <AppFooter />}
    </div>
  );
}