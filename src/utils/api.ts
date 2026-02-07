/**
 * ShadowSettle backend API client.
 * Set VITE_BACKEND_URL in .env (default: http://localhost:3001).
 */
const BASE = typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3001';

export type SettlementResult = {
  payouts: { wallet: string; amount: number }[];
  tee_attestation: string;
};

export type RunResponse =
  | { dealId: string; taskId: string; message?: string }
  | { dealId: string; taskId: string; result: SettlementResult };

async function apiError(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => null);
  const msg = (body && typeof body === 'object' && 'error' in body ? (body as { error: string }).error : null) || res.statusText || fallback;
  const full = res.status === 404
    ? `${msg} — Is the backend running at ${BASE}? Run: cd shadowsettle_backend && npm start`
    : msg;
  throw new Error(full);
}

export async function uploadDataset(dataset: object): Promise<{ id: string; url: string; publicUrl?: string }> {
  const res = await fetch(`${BASE}/datasets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataset),
  });
  if (!res.ok) throw await apiError(res, 'Upload failed');
  return res.json();
}

export async function runSettlement(options: {
  datasetUrl: string;
  wait?: boolean;
}): Promise<RunResponse> {
  const res = await fetch(`${BASE}/settlement/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetUrl: options.datasetUrl, wait: options.wait ?? true }),
  });
  if (!res.ok) throw await apiError(res, 'Run failed');
  return res.json();
}

export async function getSettlementResult(taskId: string): Promise<{
  taskId: string;
  status: string;
  result: SettlementResult | null;
}> {
  const res = await fetch(`${BASE}/settlement/result/${taskId}`);
  if (!res.ok) throw await apiError(res, 'Fetch result failed');
  return res.json();
}

export type FaucetResponse = {
  txHash: string;
  explorerUrl: string;
  amount: string;
  message: string;
};

export async function requestTestUsdc(address: string): Promise<FaucetResponse> {
  const res = await fetch(`${BASE}/faucet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: address.trim() }),
  });
  if (!res.ok) throw await apiError(res, 'Faucet request failed');
  return res.json();
}

export type ExecuteSettlementResponse = {
  txHash: string;
  explorerUrl: string;
};

export async function executeSettlement(params: {
  recipients: string[];
  amounts: number[];
  attestation: string;
}): Promise<ExecuteSettlementResponse> {
  const res = await fetch(`${BASE}/settlement/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw await apiError(res, 'Execute settlement failed');
  return res.json();
}

export type SettlementConfig = {
  settlementAddress: string;
  tokenAddress: string | null;
  chainId: number;
  explorerUrl: string;
};

export async function getSettlementConfig(): Promise<SettlementConfig> {
  const res = await fetch(`${BASE}/settlement/config`);
  if (!res.ok) throw await apiError(res, 'Failed to load settlement config');
  return res.json();
}

export type TreasuryBalanceResponse = {
  balanceFormatted: string;
  balanceRaw: string;
  settlementAddress: string;
  source?: 'database' | 'chain';
};

export async function getTreasuryBalance(refresh = false): Promise<TreasuryBalanceResponse> {
  const url = refresh ? `${BASE}/settlement/treasury-balance?refresh=1` : `${BASE}/settlement/treasury-balance`;
  const res = await fetch(url);
  if (!res.ok) throw await apiError(res, 'Failed to load treasury balance');
  return res.json();
}

// --- Jobs (persisted in Postgres when DB configured) ---

export type JobPayload = {
  walletAddress?: string;
  taskId: string;
  dealId?: string;
  settlementName?: string;
  status?: string;
  result?: SettlementResult;
  error?: string;
  datasetUrlOverride?: string;
  submittedAt?: number;
};

export type JobResponse = {
  id: string;
  taskId: string;
  dealId: string | null;
  settlementName: string;
  status: string;
  result: SettlementResult | null;
  error: string | null;
  datasetUrlOverride: string | null;
  submittedAt: number | null;
  settledTxHash: string | null;
  settledAt: number | null;
  createdAt: string;
  updatedAt: string;
};

export async function listJobs(walletAddress?: string): Promise<JobResponse[]> {
  const url = walletAddress ? `${BASE}/jobs?wallet=${encodeURIComponent(walletAddress)}` : `${BASE}/jobs`;
  const res = await fetch(url);
  if (!res.ok) throw await apiError(res, 'Failed to list jobs');
  return res.json();
}

export async function createJob(payload: JobPayload): Promise<JobResponse> {
  const res = await fetch(`${BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await apiError(res, 'Failed to create job');
  return res.json();
}

export async function updateJobByTaskId(
  taskId: string,
  updates: { status?: string; result?: SettlementResult; error?: string; settledTxHash?: string; settledAt?: number }
): Promise<JobResponse> {
  const res = await fetch(`${BASE}/jobs/by-task/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw await apiError(res, 'Failed to update job');
  return res.json();
}

// --- Dashboard (all wallets) ---

export type DashboardStats = {
  totalFundsDeposited: string;
  activePools: number;
  jobsRunning: number;
  settlementsCompleted: number;
  settlementsSettled: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${BASE}/dashboard/stats`);
  if (!res.ok) throw await apiError(res, 'Failed to get dashboard stats');
  return res.json();
}

export type ActivityItem = {
  type: 'job_started' | 'job_completed' | 'settlement_executed';
  taskId: string;
  settlementName: string;
  timestamp: number;
  participants: number | null;
  totalPayout: number | null;
};

export type DashboardActivityResponse = { activity: ActivityItem[] };

export async function getDashboardActivity(limit?: number, wallet?: string): Promise<DashboardActivityResponse> {
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', String(limit));
  if (wallet) params.set('wallet', wallet);
  const url = `${BASE}/dashboard/activity${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw await apiError(res, 'Failed to get activity');
  return res.json();
}

// --- Health (system status) ---

export type HealthChecks = {
  backend: boolean;
  iexec: boolean;
  chain: boolean;
  checkedAt: number;
};

export async function getHealthChecks(): Promise<HealthChecks> {
  const res = await fetch(`${BASE}/health/checks`);
  if (!res.ok) return { backend: false, iexec: false, chain: false, checkedAt: Date.now() };
  return res.json();
}

// --- Network info (block height, gas price) ---

export type NetworkInfo = {
  network: string;
  blockHeight: number;
  gasPriceGwei: number;
};

export async function getNetworkInfo(): Promise<NetworkInfo> {
  const res = await fetch(`${BASE}/settlement/network-info`);
  if (!res.ok) throw await apiError(res, 'Failed to get network info');
  return res.json();
}
