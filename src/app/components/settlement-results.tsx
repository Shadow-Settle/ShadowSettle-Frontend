import { GlassCard } from './glass-card';
import { WalletConnectModal } from './wallet-connect-modal';
import { Copy, Check, CheckCircle, Shield, ExternalLink, AlertCircle, ArrowRight, Droplets } from 'lucide-react';
import { useState } from 'react';
import type { SettlementRunState } from '../App';
import { requestTestUsdc, executeSettlement } from '../../utils/api';

interface PayoutEntry {
  address: string;
  amount: string;
  status: 'ready' | 'settled';
}

type SettlementResultsProps = {
  settlementRun: SettlementRunState | null;
  walletConnected?: boolean;
  walletAddress?: string;
  onConnectWallet?: () => void;
  /** Called after Settle On-Chain succeeds; used to persist settled state and update run */
  onSettled?: (txHash: string) => void;
};

export function SettlementResults({ settlementRun, walletConnected: propsWalletConnected = false, walletAddress: propsWalletAddress, onConnectWallet, onSettled }: SettlementResultsProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [localSettled, setLocalSettled] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [localWalletConnected, setLocalWalletConnected] = useState(false);
  const [faucetAddress, setFaucetAddress] = useState('');
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetResult, setFaucetResult] = useState<{ explorerUrl: string; amount: string } | null>(null);
  const [faucetError, setFaucetError] = useState<string | null>(null);
  const [localTxHash, setLocalTxHash] = useState<string | null>(null);
  const [settleError, setSettleError] = useState<string | null>(null);

  const walletConnected = propsWalletConnected || localWalletConnected;
  const walletAddress = propsWalletAddress;

  const settledTxHash = settlementRun?.settledTxHash ?? localTxHash;
  const isSettled = !!settlementRun?.settledTxHash || localSettled;

  const proofHash = settlementRun?.result?.tee_attestation ?? '—';
  const rawPayouts = settlementRun?.result?.payouts ?? [];
  const payouts: PayoutEntry[] = rawPayouts.map((p) => ({
    address: p.wallet?.length > 20 ? `${p.wallet.slice(0, 10)}...${p.wallet.slice(-8)}` : (p.wallet ?? '—'),
    amount: typeof p.amount === 'number' ? p.amount.toLocaleString() : String(p.amount ?? '—'),
    status: (isSettled ? 'settled' : 'ready') as 'ready' | 'settled',
  }));

  const totalPayout = payouts.reduce((sum, p) => sum + (parseFloat(String(p.amount).replace(/,/g, '')) || 0), 0);
  const eligibleCount = payouts.length;

  const txHash = settledTxHash ?? '—';
  const settlementExplorerUrl = settledTxHash
    ? `https://sepolia.arbiscan.io/tx/${settledTxHash}`
    : null;

  const copyToClipboard = async (text: string, id: string) => {
    try {
      const { copyToClipboard: copy } = await import('../../utils/clipboard');
      const success = await copy(text);
      
      if (success) {
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Silently fail
    }
  };

  const canSettle = rawPayouts.length > 0 && !!settlementRun?.result?.tee_attestation;
  const handleSettle = async () => {
    if (!walletConnected) {
      setShowWalletModal(true);
      return;
    }
    if (!canSettle) {
      setSettleError('Run a confidential settlement first to get payouts and attestation.');
      return;
    }
    setSettleError(null);
    setIsSettling(true);
    try {
      const result = settlementRun!.result!;
      const { txHash: hash } = await executeSettlement({
        recipients: result.payouts.map((p) => p.wallet),
        amounts: result.payouts.map((p) => p.amount),
        attestation: result.tee_attestation,
      });
      setLocalTxHash(hash);
      setLocalSettled(true);
      onSettled?.(hash);
    } catch (e) {
      setSettleError(e instanceof Error ? e.message : 'Settlement failed');
    } finally {
      setIsSettling(false);
    }
  };

  const handleWalletConnect = (walletType: 'metamask' | 'walletconnect') => {
    console.log('Connecting to', walletType);
    setTimeout(() => {
      setLocalWalletConnected(true);
      setShowWalletModal(false);
      handleSettle();
    }, 1500);
  };

  const faucetAddressToUse = walletAddress?.trim() || faucetAddress.trim();
  const handleGetTestUsdc = async () => {
    if (!faucetAddressToUse) {
      setFaucetError('Enter your Arbitrum Sepolia wallet address');
      return;
    }
    setFaucetError(null);
    setFaucetResult(null);
    setFaucetLoading(true);
    try {
      const data = await requestTestUsdc(faucetAddressToUse);
      setFaucetResult({ explorerUrl: data.explorerUrl, amount: data.amount });
    } catch (e) {
      setFaucetError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setFaucetLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Wallet Connect Modal */}
      <WalletConnectModal 
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleWalletConnect}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Settlement Results</h1>
        <p className="text-sm text-muted-foreground">{settlementRun?.settlementName ?? 'Confidential settlement'}</p>
      </div>

      {/* Settled Confirmation Banner (shown after settlement) */}
      {isSettled && (
        <GlassCard className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-1">Settlement Finalized</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Settlement finalized on-chain when you complete the flow.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Transaction:</span>
                  <button
                    onClick={() => copyToClipboard(txHash, 'tx')}
                    className="flex items-center gap-2 group"
                  >
                    <span className="text-xs font-mono text-foreground">{txHash === '—' ? txHash : `${txHash.slice(0, 20)}...${txHash.slice(-8)}`}</span>
                    {copied === 'tx' ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                  {settlementExplorerUrl && (
                    <a
                      href={settlementExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <span>View on Explorer</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Summary Card */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-success/20 to-success/10 border border-success/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Confidential Computation Completed</h2>
              <p className="text-sm text-muted-foreground">
                These results were computed privately and are publicly verifiable.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
            <span className="text-xs font-medium text-success">TEE Verified</span>
          </div>
        </div>

        {/* Output integrity hash — real, computed inside TEE */}
        <div className="p-4 rounded-lg bg-background border border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground mb-0.5">Output integrity hash (SHA-256)</p>
              <p className="text-xs text-muted-foreground mb-2">
                Computed inside the TEE over the payout result; proves the result was not altered after execution.
              </p>
              <p className="text-sm font-mono text-foreground break-all">{proofHash}</p>
            </div>
            <button
              onClick={() => copyToClipboard(proofHash, 'proof')}
              className="p-2 rounded-md hover:bg-accent/10 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              {copied === 'proof' ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* How to verify */}
        <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-xs font-medium text-foreground mb-2">How to verify this came from the TEE run</p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>
              <strong className="text-foreground">Recompute the hash:</strong> The hash is SHA-256 of the result JSON (the <code className="bg-background/80 px-1 rounded">{"payouts"}</code> array only). Anyone can recompute it from the payouts above and confirm it matches.
            </li>
            <li>
              <strong className="text-foreground">Confirm on iExec:</strong> Open the task in the iExec Explorer to see that it ran in a TEE (Intel SGX) and produced this result.
              {settlementRun?.taskId && (
                <>
                  {' '}
                  <a
                    href={`https://explorer.iex.ec/bellecour/task/${settlementRun.taskId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    View this task on Explorer
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </li>
          </ul>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Eligible Participants</p>
            <p className="text-2xl font-semibold text-foreground">{eligibleCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Payout</p>
            <p className="text-2xl font-semibold text-foreground">${totalPayout.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Settlement Token</p>
            <p className="text-2xl font-semibold text-foreground">USDC</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payout Table */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-6">Payout Distribution</h2>

            {payouts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-sm">No payout results yet.</p>
                <p className="text-xs mt-1">Complete a confidential run to see eligible participants and amounts.</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Wallet Address</th>
                    <th className="text-right text-xs font-medium text-muted-foreground pb-3 pr-4">Amount (USDC)</th>
                    <th className="text-right text-xs font-medium text-muted-foreground pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout, index) => (
                    <tr
                      key={index}
                      className="border-b border-border/50 last:border-0 hover:bg-accent/5 transition-colors"
                    >
                      <td className="py-4 pr-4">
                        <button
                          onClick={() => copyToClipboard(
                            rawPayouts[index]?.wallet ?? payout.address,
                            `addr-${index}`
                          )}
                          className="flex items-center gap-2 group"
                        >
                          <span className="text-sm font-mono text-foreground">
                            {payout.address}
                          </span>
                          {copied === `addr-${index}` ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <span className="text-sm font-medium text-foreground">${payout.amount}</span>
                      </td>
                      <td className="py-4 text-right">
                        {payout.status === 'settled' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/20 text-xs font-medium text-success">
                            <CheckCircle className="w-3 h-3" />
                            Settled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                            Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}

            <div className="mt-6 flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
              <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Only eligible participants are shown. Ineligible wallets remain private and are not disclosed in the
                final results.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Right Column - Settlement Action & Verification */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Settlement Action Card */}
            {!isSettled && (
              <GlassCard className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-6">Execute Settlement</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Total Payout</span>
                    <span className="text-sm font-semibold text-foreground">${totalPayout.toLocaleString()} USDC</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Network</span>
                    <span className="text-sm font-medium text-foreground">Arbitrum Sepolia</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">Estimated Gas</span>
                    <span className="text-sm font-medium text-foreground">—</span>
                  </div>
                </div>

                {!canSettle && rawPayouts.length === 0 && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Run a confidential settlement from the Status page first. When it completes, payouts and a TEE attestation will appear here so you can settle on-chain.
                  </p>
                )}
                {settleError && (
                  <p className="text-xs text-destructive mb-3 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {settleError}
                  </p>
                )}
                <button
                  onClick={() => void handleSettle()}
                  disabled={isSettling || !canSettle}
                  className={`w-full px-6 py-3.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    isSettling
                      ? 'bg-primary/50 text-primary-foreground cursor-wait'
                      : !canSettle
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                  }`}
                >
                  {isSettling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Settling...
                    </>
                  ) : (
                    <>
                      Settle On-Chain
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </GlassCard>
            )}

            {/* Get test USDC — always visible for testing on Arbitrum Sepolia */}
            <GlassCard className="p-6">
              <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                Get test USDC
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Our settlement uses test USDC on Arbitrum Sepolia. Request tokens here for testing.
              </p>
              {walletAddress ? (
                <p className="text-xs text-foreground mb-3">We’ll send test USDC to your connected wallet.</p>
              ) : (
                <p className="text-xs text-foreground mb-2">Enter your Arbitrum Sepolia address:</p>
              )}
              {!walletAddress && (
                <input
                  type="text"
                  placeholder="0x..."
                  value={faucetAddress}
                  onChange={(e) => setFaucetAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono placeholder:text-muted-foreground mb-3"
                />
              )}
              <button
                type="button"
                onClick={handleGetTestUsdc}
                disabled={faucetLoading || !faucetAddressToUse}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-accent/5 text-foreground text-sm font-medium hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {faucetLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                    Minting…
                  </>
                ) : (
                  <>Get test USDC</>
                )}
              </button>
              {faucetError && (
                <p className="mt-2 text-xs text-destructive">{faucetError}</p>
              )}
              {faucetResult && (
                <p className="mt-2 text-xs text-success">
                  Minted {faucetResult.amount} USDC.{' '}
                  <a href={faucetResult.explorerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline inline-flex items-center gap-0.5">
                    View on Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              )}
            </GlassCard>

            {/* Verification Panel */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Verification</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Outcome Enforcement</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This transaction enforces the verified computation outcome on-chain
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Privacy Preserved</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      No private data or eligibility rules are revealed in the settlement transaction
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-success" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Publicly Auditable</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Anyone can verify the proof on-chain without accessing sensitive information
                    </p>
                  </div>
                </div>
              </div>

              {isSettled && settlementExplorerUrl && (
                <a
                  href={settlementExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent/5 transition-colors text-sm text-foreground"
                >
                  View on Block Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </GlassCard>

            {/* Help Card */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Settlement Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Settlement Type</p>
                  <p className="text-xs font-medium text-foreground">Batch Transfer</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Execution Method</p>
                  <p className="text-xs font-medium text-foreground">Smart Contract Call</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Finality</p>
                  <p className="text-xs font-medium text-foreground">~2 seconds (L2)</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}