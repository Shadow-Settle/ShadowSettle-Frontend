import { GlassCard } from './glass-card';
import { ProfileTreasuryGridSkeleton } from './skeletons';
import { Wallet, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { getSettlementConfig, getTreasuryBalance, type SettlementConfig } from '../../utils/api';
import { BrowserProvider, Contract } from 'ethers';

const USDC_DECIMALS = 6;
const ARBITRUM_SEPOLIA_EXPLORER = 'https://sepolia.arbiscan.io';
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];
const SETTLEMENT_ABI = [
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 amount) external',
  'function balanceOf(address account) view returns (uint256)',
];

interface ProfilePageProps {
  walletConnected: boolean;
  walletAddress?: string;
  onConnectWallet: () => void;
  completedSettlementsCount?: number;
  pendingSettlementsCount?: number;
  /** Pre-fetched by App when wallet connects; when set, treasury section uses this instead of local fetch */
  treasuryBalanceFromApp?: string | null;
  treasuryLoadingFromApp?: boolean;
  onRefreshTreasury?: () => void;
}

function formatUsdc(raw: bigint): string {
  const d = 10 ** USDC_DECIMALS;
  const whole = raw / BigInt(d);
  const frac = raw % BigInt(d);
  const fracStr = frac.toString().padStart(USDC_DECIMALS, '0').slice(0, 2);
  return `${Number(whole).toLocaleString()}.${fracStr}`;
}

/** True only when ethers reports user rejected the action (don't show a scary error for that). */
function isUserRejection(e: unknown): boolean {
  if (e == null) return false;
  const err = e as Record<string, unknown>;
  return err.code === 'ACTION_REJECTED';
}

const FRIENDLY_COALESCE_MSG = 'Confirm both the approval and deposit prompts in your wallet. If you closed a prompt, click Deposit USDC again.';

function normalizeErrorMsg(msg: string): string {
  const s = msg.toLowerCase();
  if (s.includes('could not coalesce') || s.includes('user rejected') || s.includes('rejected the request')) return FRIENDLY_COALESCE_MSG;
  return msg;
}

/** True if the error looks like a generic contract revert (e.g. custom error not decoded). */
function isGenericRevert(msg: string): boolean {
  const s = msg.toLowerCase();
  return s.includes('execution reverted') || s.includes('unknown custom error') || s.includes('revert');
}

/** Extract a user-facing message from an ethers/contract error. */
function getErrorMessage(e: unknown, context?: 'withdraw' | 'deposit'): string {
  if (e == null) return 'Transaction failed.';
  const err = e as Record<string, unknown>;
  let msg = '';
  if (typeof err.reason === 'string') msg = normalizeErrorMsg(err.reason);
  else if (typeof err.shortMessage === 'string') msg = normalizeErrorMsg(err.shortMessage);
  else {
    const info = err.info as Record<string, unknown> | undefined;
    if (info?.error != null) {
      const rpc = info.error as Record<string, unknown>;
      if (typeof rpc.message === 'string') msg = normalizeErrorMsg(rpc.message);
      else if (typeof rpc.data === 'string') msg = rpc.data.slice(0, 100);
    }
    if (!msg && typeof err.message === 'string') msg = normalizeErrorMsg(err.message);
  }
  if (!msg) return 'Transaction failed. Please try again.';
  if (context === 'withdraw' && isGenericRevert(msg)) {
    return 'Insufficient withdrawable balance. Deposit funds first or reduce the amount.';
  }
  if (context === 'deposit' && isGenericRevert(msg)) {
    return 'Transaction reverted. Check your wallet balance and approval, then try again.';
  }
  return msg;
}

export function ProfilePage({
  walletConnected,
  walletAddress,
  onConnectWallet,
  completedSettlementsCount = 0,
  pendingSettlementsCount = 0,
  treasuryBalanceFromApp,
  treasuryLoadingFromApp = false,
  onRefreshTreasury,
}: ProfilePageProps) {
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<SettlementConfig | null>(null);
  const [localTreasuryBalance, setLocalTreasuryBalance] = useState<string | null>(null);
  const [walletUsdcBalance, setWalletUsdcBalance] = useState<string | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const useAppTreasury = treasuryBalanceFromApp !== undefined;
  const treasuryBalance = useAppTreasury ? (treasuryBalanceFromApp ?? null) : localTreasuryBalance;
  const loading = useAppTreasury ? treasuryLoadingFromApp : balancesLoading;
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [withdrawableBalance, setWithdrawableBalance] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSupported, setWithdrawSupported] = useState(false);

  /** Load treasury balance from backend (only used when not using app-provided treasury). */
  const loadTreasuryBalance = useCallback(async (refresh = false) => {
    if (useAppTreasury && onRefreshTreasury) {
      onRefreshTreasury();
      return;
    }
    try {
      const res = await getTreasuryBalance(refresh);
      setLocalTreasuryBalance(res.balanceFormatted);
    } catch (e) {
      console.error('Failed to load treasury balance:', e);
      setLocalTreasuryBalance('0');
    }
  }, [useAppTreasury, onRefreshTreasury]);

  const loadBalances = useCallback(async () => {
    if (!walletAddress || !config?.settlementAddress || !config?.tokenAddress) return;
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const token = new Contract(config.tokenAddress, ERC20_ABI, provider);
      const settlement = new Contract(config.settlementAddress, SETTLEMENT_ABI, provider);
      const [walletRaw, userBalanceRaw] = await Promise.all([
        token.balanceOf(walletAddress),
        settlement.balanceOf(walletAddress).catch(() => null),
      ]);
      setWalletUsdcBalance(formatUsdc(walletRaw));
      if (userBalanceRaw != null) {
        setWithdrawableBalance(formatUsdc(userBalanceRaw));
        setWithdrawSupported(true);
      } else {
        setWithdrawableBalance(null);
        setWithdrawSupported(false);
      }
    } catch (e) {
      console.error('Failed to load balances:', e);
      setWalletUsdcBalance('—');
      setWithdrawableBalance(null);
      setWithdrawSupported(false);
    }
  }, [walletAddress, config?.settlementAddress, config?.tokenAddress]);

  useEffect(() => {
    let cancelled = false;
    getSettlementConfig()
      .then((c) => {
        if (!cancelled) setConfig(c);
      })
      .catch(() => {
        if (!cancelled) setConfig(null);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!walletConnected || !walletAddress || !config) {
      setBalancesLoading(false);
      return;
    }
    setBalancesLoading(true);
    if (!useAppTreasury) {
      loadTreasuryBalance(true).finally(() => setBalancesLoading(false));
    } else {
      setBalancesLoading(false);
    }
    loadBalances();
  }, [walletConnected, walletAddress, config, loadBalances, loadTreasuryBalance, useAppTreasury]);

  const copyAddress = async () => {
    if (walletAddress) {
      try {
        const { copyToClipboard } = await import('../../utils/clipboard');
        const success = await copyToClipboard(walletAddress);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  const explorerAddressUrl = walletAddress
    ? `${ARBITRUM_SEPOLIA_EXPLORER}/address/${walletAddress}`
    : '#';

  const handleWithdraw = async () => {
    if (!walletAddress || !config?.settlementAddress) {
      setWithdrawError('Config or wallet not ready.');
      return;
    }
    const amount = parseFloat(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError('Enter a valid amount.');
      return;
    }
    setWithdrawError(null);
    setWithdrawLoading(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const settlement = new Contract(config.settlementAddress, SETTLEMENT_ABI, signer);
      const amountWei = BigInt(Math.floor(amount * 10 ** USDC_DECIMALS));
      const tx = await settlement.withdraw(amountWei);
      await tx.wait();
      setWithdrawAmount('');
      await loadTreasuryBalance(true);
      await loadBalances();
    } catch (e) {
      setWithdrawError(getErrorMessage(e, 'withdraw'));
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!walletAddress || !config?.settlementAddress || !config?.tokenAddress) {
      setDepositError('Config or wallet not ready.');
      return;
    }
    const amount = parseFloat(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setDepositError('Enter a valid amount.');
      return;
    }
    setDepositError(null);
    setDepositLoading(true);
    try {
      console.debug('[Deposit] Using settlement=', config.settlementAddress, 'token=', config.tokenAddress, 'amount=', amount, 'USDC');
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      console.debug('[Deposit] Signer obtained, address=', await signer.getAddress());
      const token = new Contract(config.tokenAddress, ERC20_ABI, signer);
      const settlement = new Contract(config.settlementAddress, SETTLEMENT_ABI, signer);
      const amountWei = BigInt(Math.floor(amount * 10 ** USDC_DECIMALS));

      const allowance = await token.allowance(walletAddress, config.settlementAddress);
      console.debug('[Deposit] Allowance=', allowance.toString(), 'need=', amountWei.toString());
      if (allowance < amountWei) {
        if (allowance > 0n) {
          console.debug('[Deposit] Resetting allowance to 0...');
          const txReset = await token.approve(config.settlementAddress, 0n);
          await txReset.wait();
          console.debug('[Deposit] Reset tx confirmed');
        }
        console.debug('[Deposit] Approving amount=', amountWei.toString());
        const txApprove = await token.approve(config.settlementAddress, amountWei);
        await txApprove.wait();
        console.debug('[Deposit] Approve tx confirmed');
      }
      console.debug('[Deposit] Calling settlement.deposit(', amountWei.toString(), ')...');
      const txDeposit = await settlement.deposit(amountWei);
      await txDeposit.wait();
      console.debug('[Deposit] Deposit tx confirmed, hash=', txDeposit.hash);
      setDepositAmount('');
      await loadTreasuryBalance(true);
      await loadBalances();
    } catch (e) {
      const err = e as Record<string, unknown>;
      console.error('[Deposit] Error:', {
        code: err.code,
        reason: err.reason,
        shortMessage: err.shortMessage,
        message: err.message,
        full: String(e),
      });
      if (isUserRejection(e)) {
        setDepositError(null);
      } else {
        setDepositError(getErrorMessage(e, 'deposit'));
      }
    } finally {
      setDepositLoading(false);
    }
  };

  if (!walletConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your wallet and settlement treasury</p>
        </div>

        <GlassCard className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Wallet Connection Required</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Connect your wallet to view your settlement treasury, fund pools, and manage on-chain assets.
            </p>
            <button
              onClick={onConnectWallet}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Connect Wallet
            </button>
            <p className="text-xs text-muted-foreground mt-4">
              Your wallet is only used for on-chain transactions and fund custody.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your wallet and settlement treasury</p>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-6">Connected Wallet</h2>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-sm font-mono text-foreground">{walletAddress}</p>
              <button
                onClick={copyAddress}
                className="p-1.5 rounded hover:bg-accent/10 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <a
                href={explorerAddressUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-accent/10 transition-colors"
                title="View on explorer"
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-muted-foreground">Connected to Arbitrum Sepolia</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-6">Settlement Treasury</h2>
        {loading ? (
          <ProfileTreasuryGridSkeleton />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-6">
            <p className="text-xs text-muted-foreground mb-2">Available Balance</p>
            <p className="text-3xl font-semibold text-foreground mb-1">
              ${treasuryBalance ?? '0'}
            </p>
            <p className="text-xs text-muted-foreground">USDC</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-xs text-muted-foreground mb-2">Pending Settlements</p>
            <p className="text-3xl font-semibold text-foreground mb-1">{pendingSettlementsCount}</p>
            <p className="text-xs text-muted-foreground">Jobs</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-xs text-muted-foreground mb-2">Total Settlements</p>
            <p className="text-3xl font-semibold text-foreground mb-1">{completedSettlementsCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </GlassCard>
        </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-6">Treasury Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-2">Deposit Funds</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add USDC to your settlement treasury for executing payouts. Your wallet balance: {walletUsdcBalance != null ? `$${walletUsdcBalance} USDC` : '…'}
            </p>
            {!config?.tokenAddress ? (
              <p className="text-xs text-muted-foreground mb-3">Settlement not configured on backend.</p>
            ) : (
              <>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Amount (USDC)"
                  value={depositAmount}
                  onChange={(e) => {
                    setDepositAmount(e.target.value);
                    setDepositError(null);
                  }}
                  className="w-full mb-3 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
                {depositError && (
                  <p className="text-xs text-destructive mb-2">{depositError}</p>
                )}
                <p className="text-xs text-muted-foreground mb-3">
                  You may see 1–2 wallet prompts: approve USDC spending, then deposit. Confirm both to complete.
                </p>
              </>
            )}
            <button
              onClick={handleDeposit}
              disabled={depositLoading || !config?.tokenAddress}
              className="w-full px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {depositLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Deposit USDC
            </button>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-2">Withdraw Funds</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Withdraw your USDC from the settlement treasury. Your withdrawable balance: {withdrawableBalance != null ? `$${withdrawableBalance} USDC` : withdrawSupported === false ? 'Not supported by contract' : '…'}
            </p>
            {withdrawSupported && (
              <>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Amount (USDC)"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full mb-3 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
                {withdrawError && (
                  <p className="text-xs text-destructive mb-2">{withdrawError}</p>
                )}
              </>
            )}
            <button
              onClick={handleWithdraw}
              disabled={withdrawLoading || !withdrawSupported || !config?.settlementAddress}
              className="w-full px-6 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent/5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {withdrawLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {withdrawSupported ? 'Withdraw USDC' : 'Withdraw USDC (not available)'}
            </button>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="p-6 bg-accent/5 border-accent/20">
        <h3 className="text-sm font-semibold text-foreground mb-3">Security Notice</h3>
        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>• Your wallet is used only for signing on-chain transactions and managing treasury funds.</p>
          <p>• Confidential settlement computations do not require wallet connection and run entirely in the TEE.</p>
          <p>• Private data never touches your wallet or is stored on-chain.</p>
        </div>
      </GlassCard>
    </div>
  );
}
