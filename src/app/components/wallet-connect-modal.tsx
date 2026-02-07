import { GlassCard } from './glass-card';
import { X, Wallet, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string) => void;
}

export function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectingWallet, setConnectingWallet] = useState<'metamask' | 'walletconnect' | null>(null);

  if (!isOpen) return null;

  const handleMetaMaskConnect = async () => {
    setConnecting(true);
    setConnectingWallet('metamask');
    setError(null);

    try {
      const { connectMetaMask, isMetaMaskInstalled, signVerificationMessage, getCurrentAccount } = await import('../../utils/wallet');

      if (!isMetaMaskInstalled()) {
        setError('MetaMask is not installed. Please install the MetaMask browser extension.');
        setConnecting(false);
        setConnectingWallet(null);
        setTimeout(() => window.open('https://metamask.io/download/', '_blank'), 2000);
        return;
      }

      const connection = await connectMetaMask();
      // Use MetaMask’s currently selected account (in case it differs from connection)
      const current = await getCurrentAccount();
      const address = (current && current.length > 0) ? current : connection.address;

      // Verify ownership by signing a message (no on-chain tx)
      await signVerificationMessage(connection.provider, address);

      onConnect(address);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect or verify. Please try again.';
      setError(message);
    } finally {
      setConnecting(false);
      setConnectingWallet(null);
    }
  };

  const handleWalletConnectConnect = async () => {
    setConnecting(true);
    setConnectingWallet('walletconnect');
    setError(null);

    try {
      // Dynamically import wallet utilities
      const { connectWalletConnect } = await import('../../utils/wallet');
      
      const connection = await connectWalletConnect();
      
      // Success - notify parent
      onConnect(connection.address);
      onClose();
    } catch (err: any) {
      console.error('WalletConnect error:', err);
      setError(err.message || 'WalletConnect is coming soon. Please use MetaMask for now.');
    } finally {
      setConnecting(false);
      setConnectingWallet(null);
    }
  };

  const handleClose = () => {
    if (!connecting) {
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        <GlassCard className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Connect Wallet to Settle</h2>
                <p className="text-sm text-muted-foreground">
                  Wallet is required only to publish results on-chain.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Network Requirement */}
          <div className="mb-6 p-3 rounded-lg bg-accent/5 border border-accent/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-foreground mb-0.5">Network Requirement</p>
              <p className="text-xs text-muted-foreground">
                Please connect to <span className="font-medium text-foreground">Arbitrum Sepolia</span> testnet
              </p>
            </div>
          </div>

          {/* Wallet Options */}
          <div className="space-y-3 mb-6">
            {/* MetaMask */}
            <button
              onClick={handleMetaMaskConnect}
              className="w-full p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/5 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">MetaMask</p>
                    <p className="text-xs text-muted-foreground">Browser extension</p>
                  </div>
                </div>
                <div className="text-muted-foreground group-hover:text-primary transition-colors">
                  {connecting && connectingWallet === 'metamask' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>

            {/* WalletConnect */}
            <button
              onClick={handleWalletConnectConnect}
              className="w-full p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/5 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">WalletConnect</p>
                    <p className="text-xs text-muted-foreground">Scan with mobile wallet</p>
                  </div>
                </div>
                <div className="text-muted-foreground group-hover:text-primary transition-colors">
                  {connecting && connectingWallet === 'walletconnect' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Footer Info */}
          <div className="p-3 rounded-lg bg-background border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your wallet will only be used to sign the settlement transaction. No private data is transmitted to your wallet or stored on-chain.
            </p>
          </div>

          {/* Help Link */}
          <div className="mt-4 text-center">
            <a
              href="#"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Need help connecting?</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs leading-relaxed">
              {error}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}