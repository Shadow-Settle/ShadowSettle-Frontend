import { GlassCard } from './glass-card';
import { Shield, Lock, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface PrivacyControlProps {
  label: string;
  description: string;
  isPrivate: boolean;
  onToggle: () => void;
}

function PrivacyControl({ label, description, isPrivate, onToggle }: PrivacyControlProps) {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-accent" />
          <h4 className="text-sm font-medium text-foreground">{label}</h4>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isPrivate ? 'bg-accent' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isPrivate ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export function PrivacySettings() {
  const [settings, setSettings] = useState({
    amount: true,
    parties: true,
    metadata: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Privacy Settings</h3>
          <p className="text-xs text-muted-foreground">Control what information remains private</p>
        </div>
      </div>

      <div className="space-y-1 divide-y divide-border/50">
        <PrivacyControl
          label="Transaction Amount"
          description="Hide settlement amounts from public view"
          isPrivate={settings.amount}
          onToggle={() => toggleSetting('amount')}
        />
        <PrivacyControl
          label="Party Identities"
          description="Keep participant addresses confidential"
          isPrivate={settings.parties}
          onToggle={() => toggleSetting('parties')}
        />
        <PrivacyControl
          label="Metadata"
          description="Encrypt additional transaction metadata"
          isPrivate={settings.metadata}
          onToggle={() => toggleSetting('metadata')}
        />
      </div>

      <div className="mt-6 p-3 rounded-lg bg-accent/5 border border-accent/20">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-accent">Privacy-preserving technology:</span> All private data is protected using zero-knowledge proofs. Only authorized parties can decrypt transaction details.
        </p>
      </div>
    </GlassCard>
  );
}

interface ConfidentialData {
  label: string;
  value: string;
  isPublic: boolean;
}

export function ConfidentialTransactionView() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  const data: ConfidentialData[] = [
    { label: 'Settlement ID', value: 'STL-2026-0421', isPublic: true },
    { label: 'Transaction Hash', value: '0x8f3a...d5c2', isPublic: true },
    { label: 'Amount', value: '$2,450,000 USDC', isPublic: false },
    { label: 'Sender', value: '0x742d...b5c9', isPublic: false },
    { label: 'Receiver', value: '0x9a3f...e8d1', isPublic: false },
    { label: 'Privacy Proof', value: 'zk-SNARK verified', isPublic: true },
  ];

  const toggleReveal = (label: string) => {
    setRevealed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      const { copyToClipboard: copy } = await import('../../utils/clipboard');
      const success = await copy(value);
      
      if (success) {
        setCopied((prev) => ({ ...prev, [label]: true }));
        setTimeout(() => {
          setCopied((prev) => ({ ...prev, [label]: false }));
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Silently fail - just don't show the checkmark
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Transaction Details</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Real Estate Bond Settlement</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
          <span className="text-xs font-medium text-success">Verified</span>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
          >
            <div className="flex items-center gap-3 flex-1">
              {!item.isPublic && (
                <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-3 h-3 text-accent" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-sm font-medium text-foreground font-mono">
                  {!item.isPublic && !revealed[item.label] ? '••••••••••' : item.value}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!item.isPublic && (
                <button
                  onClick={() => toggleReveal(item.label)}
                  className="p-1.5 rounded-md hover:bg-accent/10 transition-colors text-muted-foreground hover:text-accent"
                >
                  {revealed[item.label] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={() => copyToClipboard(item.value, item.label)}
                className="p-1.5 rounded-md hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
              >
                {copied[item.label] ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Privacy Protection Active</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Confidential data is encrypted on-chain. Only authorized parties with valid credentials can view sensitive transaction details. All computations are verified using zero-knowledge proofs to ensure correctness without revealing private information.
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}