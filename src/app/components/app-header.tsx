import { Wallet, ChevronDown, Info } from 'lucide-react';
import { useState } from 'react';

interface AppHeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  walletConnected: boolean;
  walletAddress?: string;
  onConnectWallet: () => void;
  onDisconnectWallet?: () => void;
}

export function AppHeader({
  currentPage,
  onNavigate,
  walletConnected,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
}: AppHeaderProps) {
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'create', label: 'Create Settlement' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'profile', label: 'Profile' },
    { id: 'trust', label: 'Privacy Model' },
  ];

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">
        {/* Left: Logo + Subtitle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm border-2 border-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                ShadowSettle
              </span>
              <span className="text-[10px] text-muted-foreground leading-none">
                Confidential Settlement Engine
              </span>
            </div>
          </button>
        </div>

        {/* Center: Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Wallet Area */}
        <div className="flex items-center gap-3">
          {/* Tooltip */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="p-1.5 rounded-full hover:bg-accent/10 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg bg-popover border border-border shadow-lg z-50">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Wallet required only for fund custody and on-chain actions.
                </p>
              </div>
            )}
          </div>

          {/* Wallet Button */}
          {walletConnected && walletAddress ? (
            <div className="relative">
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent/5 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-mono text-foreground">
                    {truncateAddress(walletAddress)}
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded bg-success/10 border border-success/20">
                  <span className="text-[10px] font-medium text-success">Arbitrum Sepolia</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {/* Wallet Dropdown Menu */}
              {showWalletMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowWalletMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 p-2 rounded-lg bg-popover border border-border shadow-lg z-50">
                    <div className="p-3 border-b border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Connected Address</p>
                      <p className="text-sm font-mono text-foreground break-all">{walletAddress}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowWalletMenu(false);
                          onNavigate('profile');
                        }}
                        className="w-full px-3 py-2 rounded-md text-left text-sm text-foreground hover:bg-accent/10 transition-colors"
                      >
                        View Profile
                      </button>
                      {onDisconnectWallet && (
                        <button
                          onClick={() => {
                            setShowWalletMenu(false);
                            onDisconnectWallet();
                          }}
                          className="w-full px-3 py-2 rounded-md text-left text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-all"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}