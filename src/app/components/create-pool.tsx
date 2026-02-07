import { GlassCard } from './glass-card';
import { Wallet, DollarSign, Shield, Lock, Info, CheckCircle, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { getSettlementConfig, type SettlementConfig } from '../../utils/api';
import { BrowserProvider, Contract } from 'ethers';

const USDC_DECIMALS = 6;
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];
const SETTLEMENT_ABI = [
  'function deposit(uint256 amount) external',
  'function balanceOf(address account) view returns (uint256)',
];

function formatUsdc(raw: bigint): string {
  const d = 10 ** USDC_DECIMALS;
  const whole = raw / BigInt(d);
  const frac = raw % BigInt(d);
  const fracStr = frac.toString().padStart(USDC_DECIMALS, '0').slice(0, USDC_DECIMALS);
  return fracStr === '0'.repeat(USDC_DECIMALS) ? whole.toString() : `${whole}.${fracStr}`;
}

function isUserRejection(e: unknown): boolean {
  if (e == null) return false;
  const err = e as Record<string, unknown>;
  return err.code === 'ACTION_REJECTED';
}

function getDepositErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/insufficient|balance|allowance/i.test(msg)) return 'Insufficient balance or allowance. Check USDC and try again.';
  return msg.slice(0, 120) || 'Deposit failed. Please try again.';
}

interface CreatePoolProps {
  onSubmit?: () => void;
  walletConnected?: boolean;
  walletAddress?: string;
  onConnectWallet?: () => void;
}

export function CreatePool({ onSubmit, walletConnected = false, walletAddress, onConnectWallet }: CreatePoolProps) {
  const [settlementName, setSettlementName] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [config, setConfig] = useState<SettlementConfig | null>(null);
  const [walletUsdcBalance, setWalletUsdcBalance] = useState<string | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const isFormValid = walletConnected && settlementName.trim() && depositAmount && parseFloat(depositAmount) > 0 && !depositLoading;

  const loadConfigAndBalance = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const cfg = await getSettlementConfig();
      setConfig(cfg);
      if (cfg?.tokenAddress) {
        const provider = new BrowserProvider((window as any).ethereum);
        const token = new Contract(cfg.tokenAddress, ERC20_ABI, provider);
        const raw = await token.balanceOf(walletAddress);
        setWalletUsdcBalance(formatUsdc(raw));
      } else {
        setWalletUsdcBalance(null);
      }
    } catch (e) {
      console.error('CreatePool config/balance:', e);
      setConfig(null);
      setWalletUsdcBalance('—');
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletConnected && walletAddress) loadConfigAndBalance();
  }, [walletConnected, walletAddress, loadConfigAndBalance]);

  const handleSubmit = async () => {
    if (!isFormValid || !onSubmit || !walletAddress || !config?.settlementAddress || !config?.tokenAddress) return;
    const amount = parseFloat(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setDepositError(null);
    setDepositLoading(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const token = new Contract(config.tokenAddress, ERC20_ABI, signer);
      const settlement = new Contract(config.settlementAddress, SETTLEMENT_ABI, signer);
      const amountWei = BigInt(Math.floor(amount * 10 ** USDC_DECIMALS));

      const allowance = await token.allowance(walletAddress, config.settlementAddress);
      if (allowance < amountWei) {
        if (allowance > 0n) {
          const txReset = await token.approve(config.settlementAddress, 0n);
          await txReset.wait();
        }
        const txApprove = await token.approve(config.settlementAddress, amountWei);
        await txApprove.wait();
      }
      const txDeposit = await settlement.deposit(amountWei);
      await txDeposit.wait();
      setDepositAmount('');
      onSubmit();
    } catch (e) {
      if (isUserRejection(e)) {
        setDepositError(null);
      } else {
        setDepositError(getDepositErrorMessage(e));
      }
    } finally {
      setDepositLoading(false);
    }
  };

  // If wallet not connected, show connection requirement
  if (!walletConnected) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <GlassCard className="p-12 text-center border-warning/30 bg-warning/5">
          <div className="w-16 h-16 rounded-full bg-warning/10 border-2 border-warning/20 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">Wallet Connection Required</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Creating a settlement pool requires depositing funds into a smart contract. Please connect your wallet to continue.
          </p>
          <button
            onClick={onConnectWallet}
            className="px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 inline-flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Side - Main Content */}
      <div className="lg:col-span-2 space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Create Settlement Pool</h1>
          <p className="text-sm text-muted-foreground">
            Funds are held by a smart contract and distributed only after confidential computation.
          </p>
        </div>

        {/* Pool Configuration */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Pool Configuration</h2>
              <p className="text-xs text-muted-foreground">Network and token settings</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Connected Wallet (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Connected Wallet
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 border border-border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-foreground truncate">{walletAddress}</p>
                  <p className="text-xs text-muted-foreground">Arbitrum Sepolia</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-success font-medium">Connected</span>
                </div>
              </div>
            </div>

            {/* Network (Pre-filled) */}
            <div>
              <label htmlFor="network" className="block text-sm font-medium text-foreground mb-2">
                Network
              </label>
              <input
                id="network"
                type="text"
                value="Arbitrum Sepolia"
                disabled
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Token */}
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-foreground mb-2">
                Token
              </label>
              <div className="relative">
                <input
                  id="token"
                  type="text"
                  value="USDC"
                  disabled
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="text-xs text-muted-foreground font-medium">Testnet</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Deposit Section */}
        <GlassCard className="p-6">
          <h2 className="text-base font-semibold text-foreground mb-6">Deposit Funds</h2>

          <div className="space-y-5">
            {/* Settlement Name */}
            <div>
              <label htmlFor="settlement-name" className="block text-sm font-medium text-foreground mb-2">
                Pool Name
              </label>
              <input
                id="settlement-name"
                type="text"
                value={settlementName}
                onChange={(e) => setSettlementName(e.target.value)}
                placeholder="e.g., Q1 2026 Real Estate Bond Distribution"
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-shadow"
              />
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-2">
                Amount
              </label>
              <div className="relative">
                <input
                  id="amount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => {
                    setDepositAmount(e.target.value);
                    setDepositError(null);
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg text-base font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-shadow pr-20"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">USDC</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These funds define the maximum amount that can be distributed.
              </p>
            </div>

            {/* Balance Display */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-xs text-muted-foreground">Your USDC Balance</span>
              <span className="text-sm font-mono font-medium text-foreground">{walletUsdcBalance ?? '…'} USDC</span>
            </div>

            {depositError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {depositError}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Security & Transparency Notes */}
        <GlassCard className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Security & Transparency</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                  <span>Funds are held by the smart contract—ShadowSettle never controls private keys</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                  <span>Distribution logic runs privately inside iExec Trusted Execution Environments</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                  <span>Only final settlement results are published on-chain with cryptographic proofs</span>
                </li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* Transaction Preview */}
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Transaction Preview</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Deposit Amount</span>
              <span className="text-sm font-mono font-medium text-foreground">
                {depositAmount || '0.00'} USDC
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Network Fee (estimated)</span>
              <span className="text-sm font-mono text-foreground">~0.02 USDC</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Smart Contract</span>
              <span className="text-xs font-mono text-foreground">0xSettlement...Pool</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="text-base font-mono font-semibold text-foreground">
                {depositAmount ? (parseFloat(depositAmount) + 0.02).toFixed(2) : '0.02'} USDC
              </span>
            </div>
          </div>
        </GlassCard>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <button
            disabled={!isFormValid}
            onClick={handleSubmit}
            className={`flex-1 px-6 py-3.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isFormValid
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
            }`}
          >
            {depositLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Depositing…
              </>
            ) : (
              <>
                Create & Fund Pool
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Wallet Required Notice */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-4 h-4 text-warning" />
          <span>Wallet signature required to approve fund transfer to smart contract</span>
        </div>
      </div>

      {/* Right Side - Context Panel */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
          {/* Fund Security Card */}
          <GlassCard className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Fund Security</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Smart Contract Custody</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Funds are locked in a verified smart contract. Only computation results can trigger distribution.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Private Key Control</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You maintain full custody. ShadowSettle cannot access your wallet or funds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-info/10 border border-info/20 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Verifiable Execution</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All distribution transactions are published on-chain with cryptographic proof of computation.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* What Happens Next */}
          <GlassCard className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-2">What happens next?</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Your settlement pool will be processed through a secure pipeline
            </p>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">Pool Created</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Funds deposited to smart contract
                  </p>
                </div>
              </div>

              {/* Connector */}
              <div className="ml-4 w-0.5 h-4 bg-gradient-to-b from-primary/20 to-accent/20" />

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-accent">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">Upload Settlement Data</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Submit encrypted dataset for computation
                  </p>
                </div>
              </div>

              {/* Connector */}
              <div className="ml-4 w-0.5 h-4 bg-gradient-to-b from-accent/20 to-success/20" />

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-success">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">Distribution Executed</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Funds sent to eligible recipients
                  </p>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Pool creation time</span>
                <span className="font-medium text-foreground">~30 seconds</span>
              </div>
            </div>
          </GlassCard>

          {/* Gas & Fees Info */}
          <GlassCard className="p-6 bg-info/5 border-info/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-info/20 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-info" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Network Fees</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gas fees on Arbitrum are typically under $0.10. Exact cost displayed before signing transaction.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
